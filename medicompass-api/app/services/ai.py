"""AI summarization of a second-opinion application.

Port of lib/ai.ts. Reads the patient-entered condition text + uploaded
attachments (PDFs as documents, images as vision blocks) and asks Claude for a
structured Chinese summary. Updates ai_summary_status to done/failed. Safe to
call fire-and-forget from a FastAPI BackgroundTask.
"""

import base64
from pathlib import Path

import anthropic

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.application import Application

MODEL = settings.ANTHROPIC_MODEL or "claude-opus-5"

SUPPORTED_DOC = {"application/pdf"}
SUPPORTED_IMG = {"image/png", "image/jpeg", "image/webp"}

SYSTEM = """你是一名严谨的跨境医疗病历分析助理。请阅读客户填写的信息与上传的病历附件，
用简体中文输出结构化归纳，帮助医疗顾问快速把握病情。严格基于材料内容，不臆测、不编造；
材料未提及的用「未提供」。输出使用以下小标题：
一、基本信息与就医诉求
二、主诉与现病史
三、关键检查与检验结果
四、既往史 / 用药 / 过敏
五、当前诊断（如材料中有）
六、需要顾问关注的要点与信息缺口
最后附一行免责声明：「本总结由 AI 依据所提供材料自动生成，仅供内部初步参考，不构成医疗建议或诊断。」"""


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
                    "缺少 ANTHROPIC_API_KEY，无法生成 AI 总结。请在 .env 中配置后重试。"
                )

            app.ai_summary_status = "pending"
            app.ai_summary_error = None
            db.commit()

            blocks: list[dict] = []

            field_lines = [
                f"客户姓名：{app.full_name}",
                f"国家/地区：{app.country}",
                f"需求类型：{app.need_type}",
            ]
            if app.destination:
                field_lines.append(f"期望目的地：{app.destination}")
            field_lines += ["", "客户自述病情：", app.condition or "（未填写）"]
            field_text = "\n".join(field_lines)

            blocks.append(
                {
                    "type": "text",
                    "text": f"以下是客户提交的国际二诊申请信息，请据此进行归纳总结。\n\n{field_text}",
                }
            )

            skipped: list[str] = []
            for att in app.attachments:
                try:
                    path = Path(att.stored_path)
                    if att.mime_type in SUPPORTED_DOC:
                        data = base64.b64encode(path.read_bytes()).decode("ascii")
                        blocks.append({"type": "text", "text": f"【附件：{att.original_name}】"})
                        blocks.append(
                            {
                                "type": "document",
                                "source": {
                                    "type": "base64",
                                    "media_type": "application/pdf",
                                    "data": data,
                                },
                            }
                        )
                    elif att.mime_type in SUPPORTED_IMG:
                        data = base64.b64encode(path.read_bytes()).decode("ascii")
                        blocks.append(
                            {"type": "text", "text": f"【附件（图片）：{att.original_name}】"}
                        )
                        blocks.append(
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": att.mime_type,
                                    "data": data,
                                },
                            }
                        )
                    else:
                        skipped.append(f"{att.original_name}（{att.mime_type}）")
                except OSError:
                    skipped.append(f"{att.original_name}（读取失败）")

            if skipped:
                blocks.append(
                    {
                        "type": "text",
                        "text": "注意：以下附件类型暂不支持自动解析，未纳入分析："
                        + "、".join(skipped)
                        + "。",
                    }
                )

            client = anthropic.Anthropic(
                api_key=settings.ANTHROPIC_API_KEY,
                base_url=settings.ANTHROPIC_BASE_URL or None,
            )
            response = client.messages.create(
                model=MODEL,
                max_tokens=16000,
                system=SYSTEM,
                messages=[{"role": "user", "content": blocks}],
            )

            summary = "\n".join(
                b.text for b in response.content if getattr(b, "type", None) == "text"
            ).strip()

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
