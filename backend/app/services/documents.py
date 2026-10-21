import io
import pypdf
from fastapi import HTTPException


def extract_document(filename: str, content: bytes):
    suffix = filename.rsplit(".", 1)[-1].lower()
    if suffix not in {"txt", "md", "pdf"}:
        raise HTTPException(
            status_code=415, detail="Use a PDF, text or Markdown document."
        )
    if suffix == "pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            if len(reader.pages) > 100:
                raise HTTPException(
                    status_code=413, detail="PDFs must contain 100 pages or fewer."
                )
            parts, length = [], 0
            for page in reader.pages:
                text = page.extract_text() or ""
                length += len(text)
                if length > 200_000:
                    raise HTTPException(
                        status_code=413, detail="This document contains too much text."
                    )
                parts.append(text)
            text = "\n".join(parts)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="This PDF could not be read.")
    else:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=415, detail="Text documents must use UTF-8 encoding."
            )
    if not text.strip():
        raise HTTPException(
            status_code=400, detail="The document contains no readable text."
        )
    if len(text) > 200_000:
        raise HTTPException(
            status_code=413, detail="This document contains too much text."
        )
    return text, "pdf" if suffix == "pdf" else "text"
