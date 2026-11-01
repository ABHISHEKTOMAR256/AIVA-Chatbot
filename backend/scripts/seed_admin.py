"""Create or update administrator account with bcrypt hashed password."""

import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from uuid import uuid4
import bcrypt
from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.profile import Profile


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


async def seed_admin(email: str = "admin@aiva.local", password: str = "Admin@AIVA2026", full_name: str = "System Administrator"):
    async with async_session_factory() as db:
        stmt = select(Profile).where(Profile.email == email)
        res = await db.execute(stmt)
        admin = res.scalar_one_or_none()

        pwd_hash = hash_password(password)

        if not admin:
            admin = Profile(
                id=uuid4(),
                email=email,
                full_name=full_name,
                role="admin",
                password_hash=pwd_hash,
                is_active=True,
            )
            db.add(admin)
            print(f"Created new administrator account: {email}")
        else:
            admin.role = "admin"
            admin.password_hash = pwd_hash
            admin.is_active = True
            print(f"Updated existing account to admin with new password: {email}")

        await db.commit()


if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@aiva.local"
    password = sys.argv[2] if len(sys.argv) > 2 else "Admin@AIVA2026"
    asyncio.run(seed_admin(email, password))
