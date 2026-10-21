"""Promote an existing registered account; never create default credentials."""

import argparse
from pathlib import Path
from dotenv import load_dotenv


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True)
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Confirm the role change against the configured database",
    )
    args = parser.parse_args()
    if not args.confirm:
        parser.error("Review DATABASE_URL and pass --confirm to change the role.")
    load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)
    from sqlmodel import Session, select
    from app.database import engine
    from app.models import User

    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == args.email)).first()
        if not user or not user.is_active:
            parser.error("Register an active account with this email first.")
        user.role = "admin"
        session.add(user)
        session.commit()
    print("Account role updated.")


if __name__ == "__main__":
    main()
