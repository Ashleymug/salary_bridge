"""
User routes:

GET /api/users/dashboard  — computed dashboard snapshot (earnings, limits, ledger)
PUT /api/users/2fa        — toggle two-factor authentication on/off
PUT /api/users/pin        — change security PIN (requires current PIN)
"""
import calendar
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_supabase
from app.core.deps import get_current_user
from app.core.security import verify_password, hash_password
from app.models import (
    DashboardSnapshot, AdvanceResponse, LedgerEntryResponse,
    TwoFaToggleResponse, ChangePinRequest, MessageResponse,
)

router = APIRouter(prefix="/api/users", tags=["users"])


def _format_date(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return f"{dt.day} {dt.strftime('%b')} {dt.year}"
    except Exception:
        return iso


def _advance_to_response(row: dict) -> dict:
    repayment_label = row.get("repayment_date_label") or ""
    if not repayment_label and row.get("repayment_date"):
        try:
            d = datetime.fromisoformat(row["repayment_date"])
            repayment_label = f"{d.day} {d.strftime('%b')} {d.year}"
        except Exception:
            repayment_label = row["repayment_date"]
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "amount_ugx": row["amount_ugx"],
        "fee_ugx": row["fee_ugx"],
        "total_repayment_ugx": row["total_repayment_ugx"],
        "provider": row["provider"],
        "status": row["status"],
        "repayment_date_label": repayment_label,
        "reference": row["reference"],
        "created_at": row["created_at"],
    }


def _ledger_to_response(row: dict) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "kind": row["kind"],
        "amount_ugx": row["amount_ugx"],
        "description": row["description"],
        "meta": row.get("meta"),
        "advance_id": row.get("advance_id"),
        "created_at": row["created_at"],
    }


def _monthly_exposure(user_id: str, supabase) -> int:
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()
    result = (
        supabase.table("advances")
        .select("total_repayment_ugx")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .gte("created_at", start_of_month)
        .execute()
    )
    return sum(r["total_repayment_ugx"] for r in (result.data or []))


@router.get("/dashboard", response_model=DashboardSnapshot)
def get_dashboard(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    now = datetime.now(timezone.utc)

    days_in_month = calendar.monthrange(now.year, now.month)[1]
    days_worked = min(now.day, days_in_month)
    earned_fraction = days_worked / days_in_month

    salary = max(0, current_user.get("monthly_salary_ugx", 0))
    earned_to_date = int(salary * earned_fraction)
    eligible_cap = min(900_000, int(salary * 0.5))
    exposure = _monthly_exposure(current_user["id"], supabase)

    earned_based_headroom = int(eligible_cap * earned_fraction)
    max_advance_raw = earned_based_headroom - exposure
    max_advance_amount = max(50_000, min(900_000, max_advance_raw))

    eligible_withdrawal = max(0, min(eligible_cap, earned_based_headroom) - exposure)

    latest_result = (
        supabase.table("advances")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    current_advance = None
    if latest_result.data:
        latest = latest_result.data[0]
        adv_dt = datetime.fromisoformat(latest["created_at"].replace("Z", "+00:00"))
        if adv_dt.year == now.year and adv_dt.month == now.month:
            current_advance = _advance_to_response(latest)

    ledger_result = (
        supabase.table("ledger")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .limit(4)
        .execute()
    )
    recent_ledger = [_ledger_to_response(r) for r in (ledger_result.data or [])]

    pay_day = datetime(now.year, now.month, 28, tzinfo=timezone.utc)
    days_to_pay = max(0, (pay_day.date() - now.date()).days)
    pay_day_label = f"28 {pay_day.strftime('%b')} {pay_day.year}"

    return {
        "days_worked": days_worked,
        "days_in_month": days_in_month,
        "earned_to_date": earned_to_date,
        "available_earned_salary": min(earned_to_date, int(salary * 0.92)),
        "eligible_withdrawal": eligible_withdrawal,
        "max_advance_amount": max_advance_amount,
        "exposure_this_month": exposure,
        "current_advance": current_advance,
        "recent_ledger": recent_ledger,
        "next_pay_day_label": pay_day_label,
        "days_to_pay": days_to_pay,
    }


@router.put("/2fa", response_model=TwoFaToggleResponse)
def toggle_two_fa(current_user: dict = Depends(get_current_user)):
    """Toggle 2FA on or off for the authenticated user."""
    new_value = not bool(current_user.get("two_fa_enabled", False))
    supabase = get_supabase()
    supabase.table("users").update({"two_fa_enabled": new_value}).eq("id", current_user["id"]).execute()
    supabase.table("audit_logs").insert({
        "user_id": current_user["id"],
        "title": "2FA Setting Changed",
        "detail": f"{current_user['full_name']} ({current_user['employee_id']}) {'enabled' if new_value else 'disabled'} two-factor authentication.",
        "severity": "info",
    }).execute()
    return {
        "two_fa_enabled": new_value,
        "message": f"Two-factor authentication {'enabled' if new_value else 'disabled'} successfully.",
    }


@router.put("/pin", response_model=MessageResponse)
def change_pin(payload: ChangePinRequest, current_user: dict = Depends(get_current_user)):
    """Change the authenticated user's security PIN."""
    if not verify_password(payload.current_pin, current_user.get("pin_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current PIN is incorrect.",
        )
    new_hash = hash_password(payload.new_pin)
    supabase = get_supabase()
    supabase.table("users").update({"pin_hash": new_hash}).eq("id", current_user["id"]).execute()
    supabase.table("audit_logs").insert({
        "user_id": current_user["id"],
        "title": "Security PIN Changed",
        "detail": f"{current_user['full_name']} ({current_user['employee_id']}) changed their security PIN.",
        "severity": "info",
    }).execute()
    return {"message": "PIN updated successfully."}
