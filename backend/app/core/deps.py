"""
FastAPI dependency functions: current user extraction from JWT + role checks.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.core.security import decode_access_token
from app.database import get_supabase

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _fetch_user(user_id: str) -> dict:
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return result.data[0]


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        # Reject partial/2FA-pending tokens — they cannot access protected endpoints
        scope: str = payload.get("scope", "full")
        if not user_id or scope == "2fa_pending":
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    return _fetch_user(user_id)


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user
