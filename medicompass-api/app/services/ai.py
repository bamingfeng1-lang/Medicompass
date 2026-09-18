"""AI summarization of a second-opinion application.

Uses Alibaba Bailian (DashScope) OpenAI-compatible API with qwen-vl-max model.
Reads the patient-entered condition text + uploaded attachments (PDFs are
converted to images page-by-page, images are sent directly) and asks the model
for a structured Chinese summary. Updates ai_summary_status to done/failed.
Safe to call fire-and-forget from a FastAPI BackgroundTask.
"""

import base64
from pathlib import Path

import pymupdf  # PyMuPDF
from openai import OpenAI

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.application import Application

MODEL = settings.ANTHROPIC_MODEL or "qwen-vl-max"

SUPPORTED_DOC = {"application/pdf"}
SUPPORTED_IMG = {"image/png", "image/jpeg", "image/webp"}

# Max pages to extract from a single PDF to avoid exceeding token limits.
MAX_PDF_PAGES = 10

SYSTEM = """你是一名资深临床医学专家，具有多学科会诊经验，精通内科、外科、影像诊断与病理分析。
你的任务是阅读客户填写的信息与上传的病历附件，用简体中文输出结构化归纳，帮助医疗顾问快速把握病情。

请严格基于材料内容进行分析，不臆测、不编造；材料未提及的用「未提供」。

输出使用以下小标题：
一、基本信息与就医诉求
二、主诉与现病史
三、关键检查与检验结果
四、既往史 / 用药 / 过敏
五、当前诊断（如材料中有）
六、需要顾问关注的要点与信息缺口
七、二诊医生建议（基于材料分析，针对以下问题给出专业建议）：
  1. 该患者应如何进行风险分层？这种亚临床动脉粥样硬化是否视为高危或极高危？
  2. 合适的LDL-C目标值是多少（如 <1.8 mmol/L 或 <1.4 mmol/L）？当前他汀治疗是否足够？若不足，是否应考虑高强度他汀 ± 依折麦布/PCSK9抑制剂？
  3. 对于无症状、无显著狭窄的颈动脉/无名动脉斑块，是否有抗血小板治疗指征？如有，选择何种药物及疗程？
  4. 是否需进一步评估斑块易损性（颈动脉MRI、对比增强超声、CTA/MRA）？无名动脉斑块的临床意义如何？
  5. 建议补充哪些检查：Lp(a)、ApoB、hs-CRP、HbA1c、心电图、超声心动图、ABI、冠状动脉钙化评分、脑影像学？
  6. 建议的随访间隔及影像学检查方式是什么？
  7. 是否有血运重建指征？
八、二诊医生讨论问题清单（基于患者病情和诉求，列出医生在二诊时需要重点讨论的问题）：
  根据患者的具体情况，列出 5-8 个医生需要与患者讨论的关键问题，包括但不限于：
  - 诊断确认或鉴别诊断相关的问题
  - 治疗方案选择与优化的问题
  - 预后评估与风险管理的问题
  - 生活方式调整与随访计划的问题
  - 患者最关心的症状或疑虑

最后附一行免责声明：「本总结由 AI 依据所提供材料自动生成，仅供内部初步参考，不构成医疗建议或诊断。」"""


def _pdf_to_images(pdf_path: Path) -> list[tuple[str, bytes]]:
    """Convert each page of a PDF to a PNG image. Returns list of (label, png_bytes)."""
    results: list[tuple[str, bytes]] = []
    doc = pymupdf.open(str(pdf_path))
    try:
        page_count = min(len(doc), MAX_PDF_PAGES)
        for i in range(page_count):
            page = doc[i]
            # Render at 120 DPI for a good balance of quality vs size
            mat = pymupdf.Matrix(120 / 72, 120 / 72)
            pix = page.get_pixmap(matrix=mat)
            png_bytes = pix.tobytes("png")
            results.append((f"第{i + 1}页", png_bytes))
    finally:
        doc.close()
    return results


def summarize_application(application_id: int) -> None:
    """Generate (or regenerate) the AI summary for an application."""
    db = SessionLocal()
    try:
        app = db.get(Application, application_id)
        if app is None:
            return

        try:
            if not settings.ANTHROPIC_API_KEY:
                raise RuntimeError(
                    "缺少 AI API Key，无法生成 AI 总结。请在 .env 中配置 ANTHROPIC_API_KEY 后重试。"
                )

            app.ai_summary_status = "pending"
            app.ai_summary_error = None
            db.commit()

            # Build the text portion of the prompt
            field_lines = [
                f"客户姓名：{app.full_name}",
                f"国家/地区：{app.country}",
                f"需求类型：{app.need_type}",
            ]
            if app.destination:
                field_lines.append(f"期望目的地：{app.destination}")
            field_lines += ["", "客户自述病情：", app.condition or "（未填写）"]
            field_text = "\n".join(field_lines)

            # Build multi-modal content for the OpenAI-compatible API
            content: list[dict] = [
                {
                    "type": "text",
                    "text": f"以下是客户提交的国际二诊申请信息，请据此进行归纳总结。\n\n{field_text}",
                }
            ]

            skipped: list[str] = []

            for att in app.attachments:
                try:
                    path = Path(att.stored_path)
                    if att.mime_type in SUPPORTED_DOC:
                        # Convert PDF pages to images
                        try:
                            pages = _pdf_to_images(path)
                            if not pages:
                                skipped.append(f"{att.original_name}（PDF 无内容）")
                                continue
                            for page_label, png_bytes in pages:
                                b64 = base64.b64encode(png_bytes).decode("ascii")
                                content.append(
                                    {
                                        "type": "text",
                                        "text": f"【附件 PDF：{att.original_name} - {page_label}】",
                                    }
                                )
                                content.append(
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/png;base64,{b64}",
                                        },
                                    }
                                )
                        except Exception as pdf_err:
                            skipped.append(f"{att.original_name}（PDF 解析失败：{pdf_err}）")

                    elif att.mime_type in SUPPORTED_IMG:
                        data = base64.b64encode(path.read_bytes()).decode("ascii")
                        content.append(
                            {
                                "type": "text",
                                "text": f"【附件（图片）：{att.original_name}】",
                            }
                        )
                        content.append(
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{att.mime_type};base64,{data}",
                                },
                            }
                        )
                    else:
                        skipped.append(f"{att.original_name}（{att.mime_type}）")
                except OSError:
                    skipped.append(f"{att.original_name}（读取失败）")

            if skipped:
                content.append(
                    {
                        "type": "text",
                        "text": "注意：以下附件类型暂不支持自动解析，未纳入分析："
                        + "、".join(skipped)
                        + "。",
                    }
                )

            client = OpenAI(
                api_key=settings.ANTHROPIC_API_KEY,
                base_url=settings.ANTHROPIC_BASE_URL or "https://dashscope.aliyuncs.com/compatible-mode/v1",
                timeout=300.0,  # 5分钟超时
            )
            response = client.chat.completions.create(
                model=MODEL,
                max_tokens=16000,
                messages=[
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": content},
                ],
                timeout=300.0,  # 5分钟超时
            )

            summary = (response.choices[0].message.content or "").strip()

            app.ai_summary = summary or "（模型未返回内容）"
            app.ai_summary_status = "done"
            app.ai_summary_error = None
            db.commit()
        except Exception as err:  # noqa: BLE001 - persist any failure reason
            db.rollback()
            app = db.get(Application, application_id)
            if app is not None:
                app.ai_summary_status = "failed"
                app.ai_summary_error = str(err)
                db.commit()
    finally:
        db.close()
