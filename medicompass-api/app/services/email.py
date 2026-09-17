"""Reusable email sending service.

Callers only need to provide the recipient's name, email address, a subject and
the body text — e.g.:

    from app.services.email import send_email

    result = send_email(
        name="张三",
        to_email="zhang@example.com",
        subject="申请已受理",
        body_text="您好，您的申请已进入审核。",
    )

The module reads SMTP settings from the environment/.env (see app.core.config).
If `EMAIL_ENABLED` is false, or SMTP is not fully configured, the call is a
safe no-op that returns a graceful result instead of raising — so callers never
have to guard against a missing mail server. On failure it returns a result
with `ok=False` and a message, it does not raise.

This package is intentionally generic: reuse it anywhere by passing a name,
an email, a subject and body text.
"""

from __future__ import annotations

import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

from app.core.config import settings


@dataclass
class EmailResult:
    """Outcome of a send attempt. Callers can check `ok` and show `message`."""

    ok: bool
    message: str

    def __bool__(self) -> bool:
        return self.ok


def _is_configured() -> bool:
    return bool(
        settings.EMAIL_ENABLED
        and settings.SMTP_HOST
        and (settings.SMTP_USERNAME or not settings.SMTP_PASSWORD)
        and settings.SMTP_FROM
    )


def _build_message(name: str, to_email: str, subject: str, body_text: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM))
    msg["To"] = formataddr((name or to_email, to_email))
    # Plain text body. Callers may provide HTML via body_html if they wish.
    msg.set_content(body_text)
    return msg


def send_email(
    name: str,
    to_email: str,
    subject: str,
    body_text: str,
    body_html: str | None = None,
    inline_images: dict[str, Path | str] | None = None,
<<<<<<< HEAD
=======
    attachments: list[tuple[str, bytes, str]] | None = None,
>>>>>>> f18247c (增加CART)
) -> EmailResult:
    """Send an email to a recipient.

    Args:
        name: Recipient display name (used for the greeting / To header).
        to_email: Recipient email address.
        subject: Email subject line.
        body_text: Plain-text body. Trailing newline handling is up to caller.
        body_html: Optional HTML body, attached as an alternative part if given.
        inline_images: Optional {cid: path} map attached as inline (CID) images.
<<<<<<< HEAD
=======
        attachments: Optional list of (filename, content_bytes, mime_type) tuples.
>>>>>>> f18247c (增加CART)

    Returns an EmailResult; never raises on a send failure (it logs through the
    return value so callers can decide). If email is disabled, returns a
    disabled result.
    """
    if not _is_configured():
        return EmailResult(False, "email_disabled")

    if not to_email or not subject:
        return EmailResult(False, "missing_fields")

    msg = _build_message(name, to_email, subject, body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")
    if inline_images:
        for cid, path in inline_images.items():
            img_path = Path(path)
            try:
                content = img_path.read_bytes()
                msg.add_attachment(
                    content,
                    maintype="image",
                    subtype=img_path.suffix.lstrip(".") or "png",
                    filename=img_path.name,
                    disposition="inline",
                )
                part = msg.get_payload()[-1]
                part.add_header("Content-ID", f"<{cid}>")
            except OSError:
                continue
<<<<<<< HEAD
=======
    if attachments:
        for filename, content, mime_type in attachments:
            maintype, subtype = mime_type.split("/", 1) if "/" in mime_type else ("application", "octet-stream")
            msg.add_attachment(
                content,
                maintype=maintype,
                subtype=subtype,
                filename=filename,
            )
>>>>>>> f18247c (增加CART)

    try:
        if settings.SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
        try:
            if settings.SMTP_USE_TLS and not settings.SMTP_USE_SSL:
                server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        finally:
            try:
                server.quit()
            except Exception:
                server.close()
    except smtplib.SMTPAuthenticationError:
        return EmailResult(False, "smtp_auth_failed")
    except smtplib.SMTPException as exc:
        return EmailResult(False, f"smtp_error:{exc}")
    except OSError as exc:
        return EmailResult(False, f"smtp_connect_error:{exc}")

    return EmailResult(True, "sent")


def send_email_with_greeting(
    name: str,
    to_email: str,
    subject: str,
    message: str,
) -> EmailResult:
    """Convenience wrapper: prepend a polite greeting line to the body.

    Example:
        send_email_with_greeting("张三", "z@x.com", "欢迎", "感谢您的注册。")
    """
    greeting = f"{name} 您好：" if name else "您好："
    body = f"{greeting}\n\n{message}\n\nMedicompass"
    return send_email(name=name, to_email=to_email, subject=subject, body_text=body)


# ── application-confirmation email ─────────────────────────────────────
# Template + brand logo live at the repo root (parent of the FastAPI project).
PROJECT_ROOT = Path(__file__).resolve().parents[3]
TEMPLATE_PATH = PROJECT_ROOT / "email_template.txt"
<<<<<<< HEAD
LOGO_PATH = PROJECT_ROOT / "img" / "logo" / "logo1.png"
LOGO_CID = "brandlogo"

# Static subject for the confirmation email (the HTML template no longer
# carries a subject line).
CONFIRM_SUBJECT = (
    "【Medicompass】我们已收到您的国际第二诊疗意见申请 / "
    "We have received your application for a Second Medical Opinion"
)


=======
# Blank brand template for admin-composed custom emails: only the
# {{ email_body_content }} placeholder is filled with the admin's text.
BLANK_TEMPLATE_PATH = PROJECT_ROOT / "email_template_blank.txt"
LOGO_PATH = PROJECT_ROOT / "img" / "logo" / "logo1.png"
LOGO_CID = "brandlogo"

# Need-type values → bilingual display names, used to fill the template
# placeholders (#服务申请# / #服务申请的英文#) and the dynamic subject.
# Keys accept either the Chinese or English value already stored in
# application.need_type (see lib/dictionaries needTypeOptions).
NEED_TYPE_NAMES = {
    "国际二诊": ("国际二诊", "Second Opinion"),
    "海外就医": ("海外就医", "Overseas Treatment"),
    "健康体检": ("健康体检", "Health Check-up"),
    "医疗养生": ("医疗养生", "Medical Wellness"),
    "来华手术": ("来华手术", "Surgery in China"),
    "Second Opinion": ("国际二诊", "Second Opinion"),
    "Overseas Treatment": ("海外就医", "Overseas Treatment"),
    "Health Check-up": ("健康体检", "Health Check-up"),
    "Medical Wellness": ("医疗养生", "Medical Wellness"),
    "Surgery in China": ("来华手术", "Surgery in China"),
}

# Subject template; the service name (CN + EN) is injected per need_type so
# the subject reflects the actual service the client applied for.
CONFIRM_SUBJECT_PREFIX = (
    "【Medicompass】我们已收到您的{zh}申请 / "
    "We have received your application for {en}"
)


def _need_type_names(need_type: str) -> tuple[str, str]:
    """Return (chinese_name, english_name) for a need_type value.

    Accepts either the Chinese or English value stored in need_type; unknown
    values fall back to showing the raw value for both languages.
    """
    key = (need_type or "").strip()
    if key in NEED_TYPE_NAMES:
        return NEED_TYPE_NAMES[key]
    return (key, key)


>>>>>>> f18247c (增加CART)
def send_application_confirmation_email(
    name: str,
    to_email: str,
    need_type: str,
) -> EmailResult:
    """Send the post-application confirmation email to the client.

<<<<<<< HEAD
    Reads email_template.txt (now UTF-8 HTML), uses it verbatim as the HTML
    body, inlines the brand logo (logo2.png) via CID in place of the template's
    placeholder <img>, and sends with a fixed subject. Plain-text fallback is
=======
    Reads email_template.txt (now UTF-8 HTML), fills the #服务申请# and
    #服务申请的英文# placeholders with the bilingual names for `need_type` so
    the body names the actual service the client applied for, inlines the brand
    logo (logo2.png) via CID in place of the template's placeholder <img>, and
    sends with a subject that matches that service. Plain-text fallback is
>>>>>>> f18247c (增加CART)
    derived from the HTML.
    """
    if not _is_configured():
        return EmailResult(False, "email_disabled")

    try:
        template = _load_template(TEMPLATE_PATH)
    except OSError:
        return EmailResult(False, "template_missing")
    except UnicodeDecodeError:
        return EmailResult(False, "template_decode_error")

<<<<<<< HEAD
    html = _template_with_logo(template)
    plain = _html_to_text(html)

    return send_email(
        name=name,
        to_email=to_email,
        subject=CONFIRM_SUBJECT,
=======
    cn_name, en_name = _need_type_names(need_type)

    # Fill the bilingual service placeholders in the template so the body
    # names the actual service the client applied for (not a fixed one).
    html = _template_with_logo(template)
    html = html.replace("#服务申请#", cn_name).replace("#服务申请的英文#", en_name)
    plain = _html_to_text(html)

    subject = CONFIRM_SUBJECT_PREFIX.format(zh=cn_name, en=en_name)

    return send_email(
        name=name,
        to_email=to_email,
        subject=subject,
>>>>>>> f18247c (增加CART)
        body_text=plain,
        body_html=html,
        inline_images={LOGO_CID: LOGO_PATH},
    )


<<<<<<< HEAD
=======
def _text_to_html_paragraphs(body_text: str) -> str:
    """Convert admin plain-text body into safe HTML <p> paragraphs.

    The text is HTML-escaped first (admin free text must never inject markup),
    then split on newlines; blank lines become a spacer paragraph.
    """
    import html as _html

    parts: list[str] = []
    for line in body_text.split("\n"):
        if line.strip():
            parts.append(f"<p>{_html.escape(line)}</p>")
        else:
            parts.append("<p>&nbsp;</p>")
    return "\n".join(parts)


def normalize_emails(emails: list[str | None]) -> list[str]:
    """Trim, drop empties, and de-duplicate (case-insensitive) email addresses."""
    seen: set[str] = set()
    result: list[str] = []
    for raw in emails or []:
        addr = (raw or "").strip()
        if not addr:
            continue
        key = addr.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(addr)
    return result


def send_custom_email(
    name: str,
    to_emails: list[str],
    subject: str,
    body_text: str,
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> EmailResult:
    """Send an admin-composed custom email wrapped in the blank brand template.

    The blank template (email_template_blank.txt) provides the branded header /
    footer and a single {{ email_body_content }} placeholder. The admin's
    plain-text body is HTML-escaped and rendered as paragraphs; the brand logo
    is inlined via CID. One email is sent per de-duplicated recipient.

    Returns an EmailResult whose `message` is one of:
      sent / partial:<n>/<total> / no_recipients / template_missing /
      template_decode_error / email_disabled / smtp_* errors (from send_email).
    """
    recipients = normalize_emails(to_emails)
    if not recipients:
        return EmailResult(False, "no_recipients")

    try:
        template = _load_template(BLANK_TEMPLATE_PATH)
    except OSError:
        return EmailResult(False, "template_missing")
    except UnicodeDecodeError:
        return EmailResult(False, "template_decode_error")

    html = _template_with_logo(template)
    body_html = _text_to_html_paragraphs(body_text or "")
    html = html.replace("{{ email_body_content }}", body_html)
    plain = _html_to_text(html)

    if not _is_configured():
        return EmailResult(False, "email_disabled")

    sent = 0
    last: EmailResult | None = None
    for rcpt in recipients:
        r = send_email(
            name=name,
            to_email=rcpt,
            subject=subject,
            body_text=plain,
            body_html=html,
            inline_images={LOGO_CID: LOGO_PATH},
            attachments=attachments,
        )
        if r.ok:
            sent += 1
        last = r

    if sent == len(recipients):
        return EmailResult(True, "sent")
    if sent == 0:
        return EmailResult(False, last.message if last else "failed")
    return EmailResult(False, f"partial:{sent}/{len(recipients)}")


>>>>>>> f18247c (增加CART)
def _load_template(path: Path) -> str:
    """Read the template (UTF-8) and return the HTML document."""
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        # Tolerate the old GBK-encoded template if it is ever restored.
        text = _decode_template(raw)
    marker = "<!DOCTYPE html>"
    if marker in text:
        return text[text.index(marker):]
    return text


def _template_with_logo(template: str) -> str:
    """Swap the template's placeholder <img src> for the CID-inlined logo.

    The template ships a placeholder logo URL (e.g. https://medicomai.com).
    Replace its src with cid:brandlogo so the real logo2.png renders inline.
    """
    import re as _re

    def _swap(match: "re.Match[str]") -> str:
        tag = match.group(0)
        tag = _re.sub(r'src="[^"]*"', f'src="cid:{LOGO_CID}"', tag)
        return tag

    # Only rewrite the <img ...> that lacks a src-based cid already.
    return _re.sub(r'<img[^>]*>', _swap, template)


def _html_to_text(html: str) -> str:
    """Best-effort plain-text rendering of the HTML body."""
    import re as _re

    text = _re.sub(r"<style.*?</style>", " ", html, flags=_re.DOTALL)
    text = _re.sub(r"<!--.*?-->", " ", text, flags=_re.DOTALL)
    text = _re.sub(r"<br\s*/?>", "\n", text, flags=_re.IGNORECASE)
    text = _re.sub(r"</p>|</div>|</h2>|</h.>", "\n", text, flags=_re.IGNORECASE)
    text = _re.sub(r"<[^>]+>", "", text)
    text = _re.sub(r"[ \t]+", " ", text)
    text = _re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _decode_template(raw: bytes) -> str:
    for enc in ("utf-8", "gbk", "gb18030"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("utf-8", raw, 0, 1, "unknown encoding")


