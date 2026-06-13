"""
Advance routes:

POST /api/advances/      — request a salary advance (creates advance + ledger + audit)
GET  /api/advances/      — list the current user's advances (newest first)
GET  /api/advances/{id}  — retrieve a single advance
"""
import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_supabase
from app.core.deps import get_current_user
from app.models import CreateAdvanceRequest, AdvanceResponse
from app.routers.users import _advance_to_response, _monthly_exposure

router = APIRouter(prefix="/api/advances", tags=["advances"])

FEE_UGX = 3_000
MIN_ADVANCE = 50_000
MAX_ADVANCE = 900_000


def _payday_label(now: datetime) -> str:
    """Return '28 Jun 2026'-style label for the current month's payday."""
    return f"28 {now.strftime('%b')} {now.year}"


def _repayment_date(now: datetime) -> str:
    """Return YYYY-MM-28 for the current month's repayment date."""
    return f"{now.year}-{now.month:02d}-28"


@router.post("/", response_model=AdvanceResponse, status_code=201)
def create_advance(
    payload: CreateAdvanceRequest,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()

    # Only verified users may request advances
    if current_user.get("verification_status") != "verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account must be verified before requesting a salary advance.",
        )

    now = datetime.now(timezone.utc)
    salary = max(0, current_user.get("monthly_salary_ugx", 0))

    # Re-compute eligibility on the backend (don't trust the client)
    import calendar
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    days_worked = min(now.day, days_in_month)
    earned_fraction = days_worked / days_in_month
    eligible_cap = min(MAX_ADVANCE, int(salary * 0.5))
    exposure = _monthly_exposure(current_user["id"], supabase)
    earned_headroom = int(eligible_cap * earned_fraction)
    max_allowed = max(MIN_ADVANCE, min(MAX_ADVANCE, earned_headroom - exposure))

    amount = payload.amount_ugx
    if amount < MIN_ADVANCE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Minimum advance is UGX {MIN_ADVANCE:,}.",
        )
    if amount > max_allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maximum advance for this cycle is UGX {max_allowed:,}.",
        )

    total_repayment = amount + FEE_UGX
    year = now.year
    reference = f"SB-{year}-{random.randint(1000, 9999)}"

    # Ensure reference uniqueness (retry once if collision)
    existing_ref = (
        supabase.table("advances")
        .select("id")
        .eq("reference", reference)
        .limit(1)
        .execute()
    )
    if existing_ref.data:
        reference = f"SB-{year}-{random.randint(1000, 9999)}"

    advance_row = {
        "user_id": current_user["id"],
        "amount_ugx": amount,
        "fee_ugx": FEE_UGX,
        "total_repayment_ugx": total_repayment,
        "provider": payload.provider,
        "status": "completed",
        "repayment_date": _repayment_date(now),
        "repayment_date_label": _payday_label(now),
        "reference": reference,
    }

    adv_result = supabase.table("advances").insert(advance_row).execute()
    if not adv_result.data:
        raise HTTPException(status_code=500, detail="Failed to record advance. Please try again.")

    saved_advance = adv_result.data[0]
    date_label = now.strftime(f"{now.day} %b %Y")

    # Create corresponding ledger entry
    supabase.table("ledger").insert({
        "user_id": current_user["id"],
        "kind": "advance",
        "amount_ugx": amount,
        "description": "Salary Advance Withdrawal",
        "meta": f"To MoMo • {date_label}",
        "advance_id": saved_advance["id"],
    }).execute()

    # Audit log
    supabase.table("audit_logs").insert({
        "user_id": current_user["id"],
        "title": "Advance Disbursed",
        "detail": (
            f"{current_user['full_name']} ({current_user['employee_id']}) — "
            f"UGX {amount:,} via {payload.provider}."
        ),
        "severity": "success",
    }).execute()

    return _advance_to_response(saved_advance)


@router.get("/", response_model=list[AdvanceResponse])
def list_advances(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("advances")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return [_advance_to_response(r) for r in (result.data or [])]


@router.get("/{advance_id}", response_model=AdvanceResponse)
def get_advance(advance_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("advances")
        .select("*")
        .eq("id", advance_id)
        .eq("user_id", current_user["id"])   # users can only see their own advances
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Advance not found.")
    return _advance_to_response(result.data[0])
