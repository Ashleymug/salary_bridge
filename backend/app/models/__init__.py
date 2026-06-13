"""
Pydantic schemas for all request bodies and API responses.

All response models use camelCase aliases so the JSON payload matches
the field names already used in the React frontend (e.g. fullName, employeeId).
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel


# ──────────────────────────────────────────────────────────────
# Shared base — all response models inherit this to get camelCase JSON
# ──────────────────────────────────────────────────────────────
class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,   # allow both snake_case and camelCase when parsing
    )


# ══════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    employee_id: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=200)
    ministry: str = Field(..., min_length=2, max_length=100)
    job_category: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    monthly_salary_ugx: int = Field(..., gt=0)
    phone: str = Field(..., min_length=7, max_length=20)
    provider: str = Field(...)
    pin: str = Field(..., min_length=4, max_length=72)

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in ("MTN", "Airtel"):
            raise ValueError("provider must be MTN or Airtel")
        return v


class LoginRequest(BaseModel):
    employee_id: str
    pin: str


class VerifyPhoneRequest(BaseModel):
    partial_token: str
    phone: str


class VerifyPinRequest(BaseModel):
    pin: str


class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str = Field(..., min_length=4, max_length=72)

    @field_validator("new_pin")
    @classmethod
    def validate_new_pin(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("PIN must contain digits only")
        return v


class AdminChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        errors = []
        if not any(c.isupper() for c in v):
            errors.append("at least one uppercase letter")
        if not any(c.islower() for c in v):
            errors.append("at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            errors.append("at least one digit")
        special = set('!@#$%^&*()-_=+[]{}|;:,.<>?')
        if not any(c in special for c in v):
            errors.append("at least one special character (!@#$%^&* etc.)")
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        return v

    @model_validator(mode='after')
    def check_passwords_match(self) -> 'AdminChangePasswordRequest':
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirmation do not match")
        return self


# ══════════════════════════════════════════════════════════════
# USER
# ══════════════════════════════════════════════════════════════

class UserResponse(CamelModel):
    id: str
    employee_id: str
    full_name: str
    role: str
    ministry: str
    job_category: str
    district: str
    monthly_salary_ugx: int
    phone: str
    provider: str
    verification_status: str
    two_fa_enabled: bool = False
    email: Optional[str] = None
    created_at: str


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginResponse(CamelModel):
    """
    Returned by POST /api/auth/login.
    When 2FA is required: requires_two_fa=True, partial_token is set.
    Otherwise: access_token and user are set.
    """
    requires_two_fa: bool = False
    partial_token: Optional[str] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class TwoFaToggleResponse(CamelModel):
    two_fa_enabled: bool
    message: str


# ══════════════════════════════════════════════════════════════
# ADVANCES
# ══════════════════════════════════════════════════════════════

class CreateAdvanceRequest(BaseModel):
    amount_ugx: int = Field(..., ge=50_000, le=900_000)
    provider: str

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in ("MTN", "Airtel"):
            raise ValueError("provider must be MTN or Airtel")
        return v


class AdvanceResponse(CamelModel):
    id: str
    user_id: str
    amount_ugx: int
    fee_ugx: int
    total_repayment_ugx: int
    provider: str
    status: str
    repayment_date_label: str
    reference: str
    created_at: str


# ══════════════════════════════════════════════════════════════
# LEDGER
# ══════════════════════════════════════════════════════════════

class LedgerEntryResponse(CamelModel):
    id: str
    user_id: str
    kind: str
    amount_ugx: int
    description: str
    meta: Optional[str] = None
    advance_id: Optional[str] = None
    created_at: str


# ══════════════════════════════════════════════════════════════
# DASHBOARD SNAPSHOT
# ══════════════════════════════════════════════════════════════

class DashboardSnapshot(CamelModel):
    days_worked: int
    days_in_month: int
    earned_to_date: int
    available_earned_salary: int
    eligible_withdrawal: int
    max_advance_amount: int
    exposure_this_month: int
    current_advance: Optional[AdvanceResponse] = None
    recent_ledger: list[LedgerEntryResponse]
    next_pay_day_label: str
    days_to_pay: int


# ══════════════════════════════════════════════════════════════
# ADMIN
# ══════════════════════════════════════════════════════════════

class AuditLogResponse(CamelModel):
    id: str
    user_id: Optional[str] = None
    title: str
    detail: str
    severity: str
    created_at: str


class MonthlyAdvanceStat(CamelModel):
    label: str       # e.g. "JAN", "FEB"
    amount_ugx: int


class AdminServantSummary(CamelModel):
    """UserResponse extended with payroll-specific computed fields."""
    id: str
    employee_id: str
    full_name: str
    role: str
    ministry: str
    job_category: str
    district: str
    monthly_salary_ugx: int
    phone: str
    provider: str
    verification_status: str
    two_fa_enabled: bool = False
    email: Optional[str] = None
    created_at: str
    exposure_this_month: int = 0   # total repayment amount advanced this calendar month
    advance_count: int = 0         # all-time advance count


class AdminOverview(CamelModel):
    total_servants: int
    pending_verification: int
    total_advanced_ugx: int
    avg_salary_ugx: int
    repayment_rate: float
    servants: list[AdminServantSummary]
    advances: list[AdvanceResponse]
    audit_logs: list[AuditLogResponse]
    monthly_advances: list[MonthlyAdvanceStat]


class VerifyUserRequest(BaseModel):
    verification_status: str

    @field_validator("verification_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("verified", "pending", "document_error"):
            raise ValueError("Invalid verification_status")
        return v


class UpdateSalaryRequest(BaseModel):
    monthly_salary_ugx: int = Field(..., ge=0)


class UpdateUserProfileRequest(BaseModel):
    full_name:           Optional[str] = None
    ministry:            Optional[str] = None
    job_category:        Optional[str] = None
    district:            Optional[str] = None
    phone:               Optional[str] = None
    provider:            Optional[str] = None
    verification_status: Optional[str] = None

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v):
        if v is not None and v not in ("MTN", "Airtel"):
            raise ValueError("provider must be MTN or Airtel")
        return v

    @field_validator("verification_status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ("verified", "pending", "document_error"):
            raise ValueError("Invalid verification_status")
        return v


# ══════════════════════════════════════════════════════════════
# GENERIC
# ══════════════════════════════════════════════════════════════

class AdminCreateUserRequest(BaseModel):
    employee_id: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=200)
    ministry: str = Field(..., min_length=2, max_length=100)
    job_category: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    monthly_salary_ugx: int = Field(..., ge=0)
    phone: str = Field(..., min_length=7, max_length=20)
    provider: str
    pin: str = Field(..., min_length=4, max_length=72)
    verification_status: str = "pending"
    email: Optional[str] = None

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in ("MTN", "Airtel"):
            raise ValueError("provider must be MTN or Airtel")
        return v

    @field_validator("verification_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("verified", "pending", "document_error"):
            raise ValueError("Invalid verification_status")
        return v


class MessageResponse(BaseModel):
    message: str
