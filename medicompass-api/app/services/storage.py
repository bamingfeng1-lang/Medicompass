"""Local disk storage for uploaded attachments.

Files live under data/uploads/<application_id>/; the DB only stores metadata +
stored_path. Mirrors lib/storage.ts from the original Next.js app. Swap for
object storage (S3/R2/OSS) for a serverless / multi-host deploy.
"""

import re
import time
from pathlib import Path

# Repo layout: this file is medicompass-api/app/services/storage.py
# -> parents[2] is the medicompass-api/ project root.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_ROOT = PROJECT_ROOT / "data" / "uploads"

MAX_FILE_BYTES = 15 * 1024 * 1024  # 15MB per file

# Types Claude can read directly (PDF documents + images). Other types are
# still stored, but skipped when building the AI summary.
ALLOWED_MIME = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
}

_SANITIZE_RE = re.compile(r"[^\w.\-\u4e00-\u9fa5]+")


def _sanitize(name: str) -> str:
    base = Path(name).name
    base = _SANITIZE_RE.sub("_", base)
    base = base[:180]
    return base or "file"


def is_allowed(mime_type: str, size: int) -> bool:
    return mime_type in ALLOWED_MIME and size <= MAX_FILE_BYTES


# Types browsers can safely render inline (preview in a tab). PDFs + common
# raster images. Anything else is served as a download.
INLINE_MIME = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
}


def disposition_for(mime_type: str, force_download: bool) -> str:
    """Decide Content-Disposition: 'inline' to preview, 'attachment' to download.

    PDF/image types preview inline; everything else downloads. force_download
    (the ?download=1 flag) always wins.
    """
    if force_download:
        return "attachment"
    return "inline" if (mime_type or "") in INLINE_MIME else "attachment"


def save_upload(application_id: int, original_name: str, content: bytes, mime_type: str) -> dict:
    """Persist a single uploaded file to disk under the application's folder.

    Returns metadata dict: original_name, stored_path, mime_type, size.
    """
    directory = UPLOAD_ROOT / str(application_id)
    directory.mkdir(parents=True, exist_ok=True)

    safe_name = _sanitize(original_name)
    stored = directory / f"{int(time.time() * 1000)}-{safe_name}"
    stored.write_bytes(content)

    return {
        "original_name": original_name,
        "stored_path": str(stored),
        "mime_type": mime_type or "application/octet-stream",
        "size": len(content),
    }


def save_upload_for_registration(
    reg_type: str, reg_id: int, original_name: str, content: bytes, mime_type: str
) -> dict:
    """Persist a registration license file under data/uploads/reg_<type>_<id>/.

    Returns metadata dict: original_name, stored_path, mime_type, size.
    """
    directory = UPLOAD_ROOT / f"reg_{reg_type}_{reg_id}"
    directory.mkdir(parents=True, exist_ok=True)

    safe_name = _sanitize(original_name)
    stored = directory / f"{int(time.time() * 1000)}-{safe_name}"
    stored.write_bytes(content)

    return {
        "original_name": original_name,
        "stored_path": str(stored),
        "mime_type": mime_type or "application/octet-stream",
        "size": len(content),
    }


# Final bilingual report uploads are PDF-only, up to 50MB (larger than the 15MB
# source-attachment cap).
MAX_FINAL_REPORT_BYTES = 50 * 1024 * 1024


def save_final_report(application_id: int, original_name: str, content: bytes) -> dict:
    """Persist the final bilingual report PDF under data/uploads/report_<appId>/.

    The DB stores the metadata in `attachment` with kind='final_report', and
    `application.final_bilingual_report_url` holds the stored path.
    """
    directory = UPLOAD_ROOT / f"report_{application_id}"
    directory.mkdir(parents=True, exist_ok=True)

    safe_name = _sanitize(original_name)
    stored = directory / f"{int(time.time() * 1000)}-{safe_name}"
    stored.write_bytes(content)

    return {
        "original_name": original_name,
        "stored_path": str(stored),
        "mime_type": "application/pdf",
        "size": len(content),
    }
