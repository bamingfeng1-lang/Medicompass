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
) -> EmailResult:
    """Send an email to a recipient.

    Args:
        name: Recipient display name (used for the greeting / To header).
        to_email: Recipient email address.
        subject: Email subject line.
        body_text: Plain-text body. Trailing newline handling is up to caller.
        body_html: Optional HTML body, attached as an alternative part if given.
        inline_images: Optional {cid: path} map attached as inline (CID) images.

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
LOGO_PATH = PROJECT_ROOT / "img" / "logo" / "logo1.png"
LOGO_CID = "brandlogo"

# Static subject for the confirmation email (the HTML template no longer
# carries a subject line).
CONFIRM_SUBJECT = (
    "【Medicompass】我们已收到您的国际第二诊疗意见申请 / "
    "We have received your application for a Second Medical Opinion"
)


def send_application_confirmation_email(
    name: str,
    to_email: str,
    need_type: str,
) -> EmailResult:
    """Send the post-application confirmation email to the client.

    Reads email_template.txt (now UTF-8 HTML), uses it verbatim as the HTML
    body, inlines the brand logo (logo2.png) via CID in place of the template's
    placeholder <img>, and sends with a fixed subject. Plain-text fallback is
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

    html = _template_with_logo(template)
    plain = _html_to_text(html)

    return send_email(
        name=name,
        to_email=to_email,
        subject=CONFIRM_SUBJECT,
        body_text=plain,
        body_html=html,
        inline_images={LOGO_CID: LOGO_PATH},
    )


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


