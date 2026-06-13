"""
Authentication routes: register, login (2-step), and get-current-user.

POST /api/auth/register      — create a new public servant account
POST /api/auth/login         — step 1: verify employee_id + PIN
POST /api/auth/verify-phone  — step 2 (2FA only): verify phone → issue JWT
GET  /api/auth/me            — return the authenticated user's profile
"""
from fastapi import APIRouter, HTTPException, status, Depends
from jose import JWTError
from app.database import get_supabase
from app.core.security import (
    hash_password, verify_password, create_access_token,
    normalize_phone, decode_access_token,
)
from app.core.deps import get_current_user
from app.models import (
    RegisterRequest, LoginRequest, VerifyPhoneRequest, VerifyPinRequest,
    TokenResponse, LoginResponse, UserResponse, MessageResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _build_email(full_name: str, ministry: str) -> str:
    local = (
        full_name.strip().lower()
        .replace(" ", ".")
        .strip(".")
    )
    slug = "".join(c for c in ministry.lower() if c.isalpha())[:10]
    return f"{local}@{slug}.go.ug"


def _format_user(row: dict) -> dict:
    """Strip sensitive fields before sending a user row to the client."""
    row.pop("pin_hash", None)
    return row


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest):
    supabase = get_supabase()

    existing = (
        supabase.table("users")
        .select("id")
        .eq("employee_id", payload.employee_id.strip())
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this Employee ID already exists.",
        )

    phone_normalised = normalize_phone(payload.phone)

    dup_phone = (
        supabase.table("users")
        .select("id")
        .eq("phone", phone_normalised)
        .limit(1)
        .execute()
    )
    if dup_phone.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A different account is already registered with this phone number.",
        )

    email = _build_email(payload.full_name, payload.ministry)
    pin_hash = hash_password(payload.pin)

    new_user = {
        "employee_id": payload.employee_id.strip(),
        "full_name": payload.full_name.strip(),
        "ministry": payload.ministry,
        "job_category": payload.job_category,
        "district": payload.district.strip(),
        "monthly_salary_ugx": payload.monthly_salary_ugx,
        "phone": phone_normalised,
        "provider": payload.provider,
        "verification_status": "pending",
        "role": "user",
        "pin_hash": pin_hash,
        "email": email,
        "two_fa_enabled": False,
    }

    result = supabase.table("users").insert(new_user).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")

    user_row = _format_user(result.data[0])

    supabase.table("audit_logs").insert({
        "user_id": user_row["id"],
        "title": "New Registration",
        "detail": f"{user_row['full_name']} ({user_row['employee_id']}) registered. Pending verification.",
        "severity": "info",
    }).execute()

    token = create_access_token(user_row["id"], user_row["role"])
    return {"access_token": token, "token_type": "bearer", "user": user_row}


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    """
    Step 1 of login. Verifies employee_id + PIN.
    - If the user has 2FA enabled: returns a short-lived partial_token and requires_two_fa=True.
      The client must follow up with POST /verify-phone to receive the real JWT.
    - Otherwise: returns the full JWT immediately.
    """
    supabase = get_supabase()

    emp_id = payload.employee_id.strip()
    result = (
        supabase.table("users")
        .select("*")
        .ilike("employee_id", emp_id)
        .limit(1)
        .execute()
    )
    user_row = result.data[0] if result.data else None
    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or PIN.",
        )

    if not verify_password(payload.pin, user_row.get("pin_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or PIN.",
        )

    two_fa = bool(user_row.get("two_fa_enabled", False))
    if two_fa:
        partial = create_access_token(user_row["id"], user_row["role"], scope="2fa_pending")
        return LoginResponse(requires_two_fa=True, partial_token=partial)

    token = create_access_token(user_row["id"], user_row["role"])
    return LoginResponse(access_token=token, token_type="bearer", user=_format_user(user_row))


@router.post("/verify-phone", response_model=LoginResponse)
def verify_phone(payload: VerifyPhoneRequest):
    """
    Step 2 of 2FA login. Accepts the partial_token from /login plus the
    user's registered phone number. Returns the full JWT on success.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session. Please log in again.",
    )
    try:
        jwt_payload = decode_access_token(payload.partial_token)
        if jwt_payload.get("scope") != "2fa_pending":
            raise credentials_exc
        user_id: str = jwt_payload.get("sub")
        if not user_id:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    user_row = result.data[0] if result.data else None
    if not user_row:
        raise credentials_exc

    provided = normalize_phone(payload.phone)
    stored = normalize_phone(user_row.get("phone", ""))
    if provided != stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phone number does not match our records.",
        )

    token = create_access_token(user_row["id"], user_row["role"])
    return LoginResponse(access_token=token, token_type="bearer", user=_format_user(user_row))


@router.post("/verify-pin", response_model=MessageResponse)
def verify_pin_endpoint(
    payload: VerifyPinRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Verify the authenticated user's PIN before a sensitive action (e.g. withdrawal).
    Returns 200 on success, 400 if the PIN is wrong.
    """
    if not verify_password(payload.pin, current_user.get("pin_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect PIN. Please try again.",
        )
    return {"message": "PIN verified."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return _format_user(current_user)
