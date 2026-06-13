-- ============================================================
-- GovPay Uganda — Supabase / PostgreSQL Schema
-- ============================================================
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New Query).
-- Execute the entire file top-to-bottom once per fresh project.
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
-- pgcrypto provides gen_random_uuid() on older PG versions.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── 1. USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         TEXT        NOT NULL UNIQUE,
    full_name           TEXT        NOT NULL,
    ministry            TEXT        NOT NULL,
    job_category        TEXT        NOT NULL,
    district            TEXT        NOT NULL,
    monthly_salary_ugx  BIGINT      NOT NULL DEFAULT 0,
    phone               TEXT        NOT NULL,           -- 9-digit normalised (e.g. 772777842)
    provider            TEXT        NOT NULL CHECK (provider IN ('MTN', 'Airtel')),
    verification_status TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (verification_status IN ('verified', 'pending', 'document_error')),
    role                TEXT        NOT NULL DEFAULT 'user'
                                    CHECK (role IN ('admin', 'user')),
    pin_hash            TEXT        NOT NULL,           -- bcrypt hash — NEVER expose to client
    two_fa_enabled      BOOLEAN     NOT NULL DEFAULT false,
    email               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 2. ADVANCES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advances (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_ugx           BIGINT      NOT NULL,
    fee_ugx              BIGINT      NOT NULL DEFAULT 3000,
    total_repayment_ugx  BIGINT      NOT NULL,
    provider             TEXT        NOT NULL CHECK (provider IN ('MTN', 'Airtel')),
    status               TEXT        NOT NULL DEFAULT 'completed'
                                     CHECK (status IN ('completed', 'failed', 'pending')),
    repayment_date       DATE        NOT NULL,          -- e.g. 2026-06-28
    repayment_date_label TEXT        NOT NULL,          -- e.g. "28 Jun 2026" (pre-formatted for UI)
    reference            TEXT        NOT NULL UNIQUE,   -- e.g. SB-2026-4521
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advances_user_id    ON advances(user_id);
CREATE INDEX IF NOT EXISTS idx_advances_created_at ON advances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advances_status     ON advances(status);


-- ── 3. LEDGER ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        TEXT        NOT NULL CHECK (kind IN ('advance', 'repayment')),
    amount_ugx  BIGINT      NOT NULL,
    description TEXT        NOT NULL,
    meta        TEXT,
    advance_id  UUID        REFERENCES advances(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_user_id    ON ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger(created_at DESC);


-- ── 4. AUDIT LOGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    title      TEXT        NOT NULL,
    detail     TEXT        NOT NULL,
    severity   TEXT        NOT NULL DEFAULT 'info'
                           CHECK (severity IN ('success', 'info', 'warning')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- The FastAPI backend uses the service_role key which bypasses
-- RLS entirely, so these policies protect direct Supabase
-- client access (e.g. from the dashboard or future mobile app).
-- ============================================================
ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs  ENABLE ROW LEVEL SECURITY;

-- Service-role bypass (backend) — already implicit, but explicit for clarity
-- Regular anon/authenticated Supabase JWT users are blocked by default.
-- Add per-user RLS policies here if you ever add Supabase Auth integration.


-- ============================================================
-- SEED DATA
-- Creates the default admin account and four demo public servants.
-- PIN hashes below are bcrypt hashes for the demo PINs.
--
--  admin       PIN: admin   (change immediately after first login)
--  IPPS-004952 PIN: 1234
--  UPF/99120   PIN: 4321
--  MOH/88219   PIN: 8899
--  MOW/55214   PIN: 2211
--
-- To generate your own bcrypt hash in Python:
--   import bcrypt
--   print(bcrypt.hashpw(b"yourpin", bcrypt.gensalt(12)).decode())
-- ============================================================

-- NOTE: Do NOT use these demo hashes in production.
--       Change admin credentials before going live.

INSERT INTO users (employee_id, full_name, ministry, job_category, district,
                   monthly_salary_ugx, phone, provider, verification_status,
                   role, pin_hash, email)
VALUES
  -- Admin — PIN: admin
  ('admin',
   'Hon. Moses Kato',
   'Ministry of Public Service',
   'Principal HR Officer',
   'Kampala',
   0,
   '700000000',
   'MTN',
   'verified',
   'admin',
   '$2b$12$my.DfV.iPp2TQGfNzPhjteb9W.mXfWjQqX9LFPx7BbIa5pon01XFG',  -- admin
   'm.kato@mps.go.ug'),

  -- Mirembe Sarah Musoke — PIN: 1234
  ('IPPS-004952',
   'Mirembe Sarah Musoke',
   'Ministry of Public Service',
   'Teacher / Educator',
   'Kampala',
   2900000,
   '772777842',
   'MTN',
   'verified',
   'user',
   '$2b$12$PK/./amvDQ42pr2ARkNiiOSY4dVKOckN6zWuKXlp8l5bKd7oyxvGG',  -- 1234
   's.musoke@mops.go.ug'),

  -- Joseph Okello — PIN: 4321
  ('UPF/99120',
   'Joseph Okello',
   'Ministry of Education & Sports',
   'Teacher / Educator',
   'Entebbe',
   2100000,
   '773912045',
   'MTN',
   'pending',
   'user',
   '$2b$12$vp1n3Dxr1Za9FqRlkuozWuxtUYpQsrslnMlyzhv.fUm1OLKOQaj5q',  -- 4321
   'j.okello@mps.go.ug'),

  -- Alice Mukasa — PIN: 8899
  ('MOH/88219',
   'Alice Mukasa',
   'Ministry of Health',
   'Nurse / Health Worker',
   'Wakiso',
   3400000,
   '758129033',
   'Airtel',
   'verified',
   'user',
   '$2b$12$n/su8xiZpoD/NtAr8My/dOBRjv35nL42A./A.34zmCP.GbzshACZq',  -- 8899
   'a.mukasa@health.go.ug'),

  -- Kevin Namara — PIN: 2211
  ('MOW/55214',
   'Kevin Namara',
   'Ministry of Works & Transport',
   'Administrative Officer',
   'Jinja',
   2450000,
   '700456211',
   'Airtel',
   'document_error',
   'user',
   '$2b$12$v32fPvt6iB5tYheCKsFeg.w862uZt0K2ATrqm9Z4Btl4tBOsFnkXK',  -- 2211
   'k.namara@mow.go.ug')

ON CONFLICT (employee_id) DO NOTHING;


-- ============================================================
-- MIGRATIONS (run if the table already existed before this column was added)
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN NOT NULL DEFAULT false;
