"""
Password hashing (bcrypt) and JWT token creation / verification.
"""
import re
from datetime import datetime, timedelta, timezone
import bcrypt as _bcrypt
from jose import jwt, JWTError
from app.config import get_settings


def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, role: str, scope: str = "full") -> str:
    settings = get_settings()
    # Partial tokens (used during 2FA step) expire in 5 minutes
    expire_minutes = 5 if scope == "2fa_pending" else settings.jwt_expire_minutes
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {"sub": user_id, "role": role, "scope": scope, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and return payload. Raises JWTError on failure."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def normalize_phone(raw: str) -> str:
    """Normalise a Ugandan phone number to 9 digits (e.g. '772777842')."""
    digits = re.sub(r"\D", "", str(raw))
    if digits.startswith("256"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    # take last 9 digits to be safe
    return digits[-9:] if len(digits) >= 9 else digits
