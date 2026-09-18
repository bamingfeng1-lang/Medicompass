"""Seed a default admin from ADMIN_USERNAME / ADMIN_PASSWORD.

Port of prisma/seed.cjs. Run with:  python -m scripts.seed_admin
"""

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.admin import Admin


def main() -> None:
    username = settings.ADMIN_USERNAME or "admin"
    password = settings.ADMIN_PASSWORD or "changeme"

    db = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.username == username).first()
        password_hash = hash_password(password)
        if admin is None:
            admin = Admin(username=username, password_hash=password_hash)
            db.add(admin)
        else:
            admin.password_hash = password_hash
        db.commit()
        print(f'✓ Admin ready: username="{username}"')
        if password == "changeme":
            print("⚠  Using default password 'changeme' — set ADMIN_PASSWORD in .env.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
