"""
One-time migration: move base64 profile pictures out of the `user` table into
Supabase Storage, leaving only the public URL in `profile_pic`.

Run from the backend folder, with the same DATABASE_URL / SUPABASE_URL /
SUPABASE_KEY as production (e.g. in backend/.env):

    python migrate_profile_pics.py            # dry run: just reports
    python migrate_profile_pics.py --apply    # actually migrates

Safe to re-run: users whose picture is already a URL are skipped.
"""
import base64
import re
import sys
from uuid import uuid4

from dotenv import load_dotenv

load_dotenv()

from sqlmodel import Session, select  # noqa: E402

from app.database import engine  # noqa: E402
from app.schemas import User  # noqa: E402
from app.utils import get_supabase  # noqa: E402
from app.routes.users import AVATAR_BUCKET  # noqa: E402

DATA_URL = re.compile(r"^data:(image/(png|jpeg|jpg|webp|gif));base64,(.+)$", re.DOTALL)
EXT = {"image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/webp": ".webp", "image/gif": ".gif"}


def main(apply: bool) -> None:
    sb = get_supabase()
    if apply and not sb:
        sys.exit("SUPABASE_URL / SUPABASE_KEY are not set; cannot upload.")

    migrated = skipped = failed = 0
    with Session(engine) as session:
        users = session.exec(select(User).where(User.profile_pic.is_not(None))).all()
        for user in users:
            pic = user.profile_pic or ""
            match = DATA_URL.match(pic)
            if not match:
                skipped += 1  # already a URL (or empty)
                continue
            mime = match.group(1)
            try:
                data = base64.b64decode(match.group(3))
            except Exception:
                print(f"  ! {user.email}: invalid base64, skipped")
                failed += 1
                continue
            print(f"  - {user.email}: {len(pic) // 1024} KB of base64 -> {len(data) // 1024} KB file")
            if not apply:
                migrated += 1
                continue
            path = f"{user.id}/{uuid4().hex}{EXT[mime]}"
            try:
                sb.storage.from_(AVATAR_BUCKET).upload(
                    path, data, file_options={"content-type": mime, "cache-control": "31536000"}
                )
                user.profile_pic = sb.storage.from_(AVATAR_BUCKET).get_public_url(path)
                session.add(user)
                session.commit()
                migrated += 1
            except Exception as exc:
                session.rollback()
                print(f"  ! {user.email}: upload failed ({exc})")
                failed += 1

    action = "Migrated" if apply else "Would migrate"
    print(f"\n{action}: {migrated}   already URLs: {skipped}   failed: {failed}")
    if not apply:
        print("Dry run only. Re-run with --apply to migrate.")


if __name__ == "__main__":
    main(apply="--apply" in sys.argv)
