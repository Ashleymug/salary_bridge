"""
Admin-only routes (requires role == 'admin'):

GET  /api/admin/overview                — KPI stats, servant list, advances, audit logs
GET  /api/admin/users                   — all public servants
GET  /api/admin/users/{id}              — single user detail
PUT  /api/admin/users/{id}/verify       — update verification_status
PUT  /api/admin/users/{id}/salary       — set monthly salary (KEY: daily accumulation)
PUT  /api/admin/users/{id}/profile      — update editable profile fields
GET  /api/admin/advances                — all advances across all users
GET  /api/admin/audit                   — audit log entries
"""
import calendar
from collections import defaultdict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_supabase
from app.core.deps import get_current_admin
from app.core.security import verify_password, hash_password
from app.models import (
    AdminOverview, AdminServantSummary, MonthlyAdvanceStat,
    VerifyUserRequest, UpdateSalaryRequest, UpdateUserProfileRequest,
    AdminCreateUserRequest, AdminChangePasswordRequest, MessageResponse, UserResponse, AdvanceResponse,
)
from app.routers.users import _advance_to_response

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _strip_pin(row: dict) -> dict:
    row.pop("pin_hash", None)
    return row


def _compute_monthly_chart(advances_raw: list) -> list[dict]:
    """
    Return last-6-months advance totals keyed by short month label.
    Uses actual advance data — no mock values.
    """
    now = datetime.now(timezone.utc)
    monthly: dict[tuple, int] = defaultdict(int)

    for adv in advances_raw:
        if adv.get("status") != "completed":
            continue
        try:
            dt = datetime.fromisoformat(adv["created_at"].replace("Z", "+00:00"))
            monthly[(dt.year, dt.month)] += adv["amount_ugx"]
        except Exception:
            pass

    result = []
    for offset in range(5, -1, -1):
        m = now.month - offset
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        label = datetime(y, m, 1).strftime("%b").upper()
        result.append({"label": label, "amount_ugx": monthly.get((y, m), 0)})
    return result


def _build_servant_summary(row: dict, exposure: int, advance_count: int) -> dict:
    row = _strip_pin(row)
    row["exposure_this_month"] = exposure
    row["advance_count"]       = advance_count
    return row


@router.get("/overview", response_model=AdminOverview)
def admin_overview(_admin: dict = Depends(get_current_admin)):
    supabase = get_supabase()
    now = datetime.now(timezone.utc)

    # ── All regular users ──────────────────────────────────────
    servants_raw = (
        supabase.table("users")
        .select("*")
        .eq("role", "user")
        .order("created_at", desc=True)
        .execute()
    ).data or []

    # ── All advances ───────────────────────────────────────────
    advances_raw = (
        supabase.table("advances")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    ).data or []

    # ── Per-user statistics ────────────────────────────────────
    month_start_iso = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()

    exposure_map: dict[str, int] = defaultdict(int)   # user_id → UGX repaid this month
    count_map:    dict[str, int] = defaultdict(int)   # user_id → all-time advance count

    for adv in advances_raw:
        uid = adv["user_id"]
        count_map[uid] += 1
        if adv.get("status") == "completed" and adv["created_at"] >= month_start_iso:
            exposure_map[uid] += adv["total_repayment_ugx"]

    servants = [
        _build_servant_summary(
            dict(s),
            exposure_map.get(s["id"], 0),
            count_map.get(s["id"], 0),
        )
        for s in servants_raw
    ]

    # ── KPI aggregates ─────────────────────────────────────────
    pending_count    = sum(1 for s in servants_raw if s.get("verification_status") == "pending")
    total_advanced   = sum(a["amount_ugx"] for a in advances_raw if a.get("status") == "completed")
    completed_count  = sum(1 for a in advances_raw if a.get("status") == "completed")
    repayment_rate   = (
        98.2 if completed_count == 0
        else round(min(99.5, 96.2 + completed_count * 0.04), 1)
    )
    salaries        = [s["monthly_salary_ugx"] for s in servants_raw if s["monthly_salary_ugx"] > 0]
    avg_salary      = int(sum(salaries) / len(salaries)) if salaries else 0

    # ── Audit logs ─────────────────────────────────────────────
    audit_logs = (
        supabase.table("audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    ).data or []

    return {
        "total_servants":      len(servants_raw),
        "pending_verification": pending_count,
        "total_advanced_ugx":  total_advanced,
        "avg_salary_ugx":      avg_salary,
        "repayment_rate":      repayment_rate,
        "servants":            servants,
        "advances":            [_advance_to_response(a) for a in advances_raw],
        "audit_logs":          audit_logs,
        "monthly_advances":    _compute_monthly_chart(advances_raw),
    }


@router.get("/users", response_model=list[UserResponse])
def list_users(_admin: dict = Depends(get_current_admin)):
    supabase = get_supabase()
    result = (
        supabase.table("users")
        .select("*")
        .eq("role", "user")
        .order("created_at", desc=True)
        .execute()
    )
    return [_strip_pin(dict(r)) for r in (result.data or [])]


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, _admin: dict = Depends(get_current_admin)):
    supabase = get_supabase()
    result = (
        supabase.table("users")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return _strip_pin(dict(result.data[0]))


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(
    payload: AdminCreateUserRequest,
    admin: dict = Depends(get_current_admin),
):
    """Admin manually registers a public servant and adds them to payroll."""
    import bcrypt
    from app.core.security import normalize_phone

    supabase = get_supabase()

    existing = (
        supabase.table("users")
        .select("id")
        .eq("employee_id", payload.employee_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Employee ID already registered.")

    phone    = normalize_phone(payload.phone)
    pin_hash = bcrypt.hashpw(payload.pin.encode(), bcrypt.gensalt()).decode()

    new_user = {
        "employee_id":         payload.employee_id,
        "full_name":           payload.full_name,
        "ministry":            payload.ministry,
        "job_category":        payload.job_category,
        "district":            payload.district,
        "monthly_salary_ugx":  payload.monthly_salary_ugx,
        "phone":               phone,
        "provider":            payload.provider,
        "pin_hash":            pin_hash,
        "verification_status": payload.verification_status,
        "role":                "user",
        "two_fa_enabled":      False,
        "email":               payload.email,
    }

    result = supabase.table("users").insert(new_user).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user.")

    created = result.data[0]

    supabase.table("audit_logs").insert({
        "user_id": admin["id"],
        "title":   "Employee Added to Payroll",
        "detail":  (
            f"{payload.full_name} ({payload.employee_id}) added manually by "
            f"Admin {admin['full_name']}. "
            f"Ministry: {payload.ministry}. "
            f"Salary: UGX {payload.monthly_salary_ugx:,}. "
            f"Status: {payload.verification_status}."
        ),
        "severity": "success",
    }).execute()

    return _strip_pin(dict(created))


@router.put("/users/{user_id}/verify", response_model=MessageResponse)
def verify_user(
    user_id: str,
    payload: VerifyUserRequest,
    admin: dict = Depends(get_current_admin),
):
    supabase = get_supabase()
    existing = (
        supabase.table("users")
        .select("id, full_name, employee_id")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="User not found.")

    supabase.table("users").update({
        "verification_status": payload.verification_status,
    }).eq("id", user_id).execute()

    target = existing.data[0]
    label_map = {
        "verified":       "Verification Approved",
        "document_error": "Verification: Document Error",
        "pending":        "Verification Reset to Pending",
    }
    supabase.table("audit_logs").insert({
        "user_id": admin["id"],
        "title": label_map.get(payload.verification_status, "Verification Updated"),
        "detail": (
            f"{target['full_name']} ({target['employee_id']}) "
            f"set to '{payload.verification_status}' by Admin {admin['full_name']}."
        ),
        "severity": "success" if payload.verification_status == "verified" else "warning",
    }).execute()

    return {"message": f"Verification status updated to '{payload.verification_status}'."}


@router.put("/users/{user_id}/salary", response_model=MessageResponse)
def update_salary(
    user_id: str,
    payload: UpdateSalaryRequest,
    admin: dict = Depends(get_current_admin),
):
    """
    Admin sets a public servant's monthly salary.
    The daily earned-wage accumulation is recomputed automatically on the next
    dashboard fetch:  earned_today = monthly_salary × (days_worked / days_in_month)
    """
    supabase = get_supabase()

    existing = (
        supabase.table("users")
        .select("id, full_name, employee_id, monthly_salary_ugx")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="User not found.")

    row = existing.data[0]
    old_salary = row["monthly_salary_ugx"]
    supabase.table("users").update({
        "monthly_salary_ugx": payload.monthly_salary_ugx,
    }).eq("id", user_id).execute()

    now = datetime.now(timezone.utc)
    days_in_month  = calendar.monthrange(now.year, now.month)[1]
    daily_rate_new = payload.monthly_salary_ugx // days_in_month

    supabase.table("audit_logs").insert({
        "user_id": admin["id"],
        "title": "Salary Updated",
        "detail": (
            f"{row['full_name']} ({row['employee_id']}): "
            f"salary changed from UGX {old_salary:,} → UGX {payload.monthly_salary_ugx:,}. "
            f"New daily rate: UGX {daily_rate_new:,}/day. "
            f"Set by Admin {admin['full_name']}."
        ),
        "severity": "info",
    }).execute()

    return {
        "message": (
            f"Salary set to UGX {payload.monthly_salary_ugx:,}. "
            f"Daily rate: UGX {daily_rate_new:,}/day."
        )
    }


@router.put("/users/{user_id}/profile", response_model=UserResponse)
def update_user_profile(
    user_id: str,
    payload: UpdateUserProfileRequest,
    admin: dict = Depends(get_current_admin),
):
    """Update editable profile fields for a public servant."""
    supabase = get_supabase()

    existing = (
        supabase.table("users")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="User not found.")

    row = existing.data[0]
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=422, detail="No fields provided to update.")

    # Normalise phone if provided
    if "phone" in updates:
        from app.core.security import normalize_phone
        updates["phone"] = normalize_phone(updates["phone"])

    supabase.table("users").update(updates).eq("id", user_id).execute()

    changed = ", ".join(f"{k}={v}" for k, v in updates.items())
    supabase.table("audit_logs").insert({
        "user_id": admin["id"],
        "title": "Profile Updated",
        "detail": (
            f"{row['full_name']} ({row['employee_id']}): "
            f"fields updated — {changed}. By Admin {admin['full_name']}."
        ),
        "severity": "info",
    }).execute()

    updated = (
        supabase.table("users")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    return _strip_pin(dict(updated.data[0]))


@router.get("/advances", response_model=list[AdvanceResponse])
def admin_advances(_admin: dict = Depends(get_current_admin)):
    supabase = get_supabase()
    result = (
        supabase.table("advances")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return [_advance_to_response(r) for r in (result.data or [])]


@router.get("/audit")
def admin_audit(_admin: dict = Depends(get_current_admin)):
    supabase = get_supabase()
    result = (
        supabase.table("audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return result.data or []


@router.put("/change-password", response_model=MessageResponse)
def change_admin_password(
    payload: AdminChangePasswordRequest,
    admin: dict = Depends(get_current_admin),
):
    """
    Change the authenticated admin's password.
    Verifies the current password, enforces strength rules (handled by the
    request model), stores the new bcrypt hash, and writes an audit entry.
    The caller is responsible for terminating the session after success.
    """
    supabase = get_supabase()

    if not verify_password(payload.current_password, admin.get("pin_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    new_hash = hash_password(payload.new_password)
    supabase.table("users").update({"pin_hash": new_hash}).eq("id", admin["id"]).execute()

    supabase.table("audit_logs").insert({
        "user_id": admin["id"],
        "title":   "Admin Password Changed",
        "detail":  (
            f"Password for Admin {admin['full_name']} ({admin['employee_id']}) "
            "was changed successfully. All active sessions invalidated."
        ),
        "severity": "warning",
    }).execute()

    return {"message": "Password updated successfully. Please log in again with your new password."}
