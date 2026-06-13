import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Bell, ArrowRight, Building2,
  TrendingUp, Zap, Calendar,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MobileMoneyCard from '../components/MobileMoneyCard';
import VerificationBadge from '../components/VerificationBadge';
import { useAuth } from '../context/useAuth.js';
import { getDashboard } from '../api/users.js';
import { AdvanceSkeleton } from '../components/Skeleton.jsx';
import { createAdvance } from '../api/advances.js';
import { formatUGX, maskPhone } from '../lib/format.js';

export default function AdvancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [snap, setSnap]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]   = useState('');

  const [amount, setAmount]     = useState(450_000);
  const [provider, setProvider] = useState(user?.provider ?? 'MTN');

  useEffect(() => {
    getDashboard()
      .then((res) => {
        setSnap(res.data);
        const max = res.data.maxAdvanceAmount ?? 900_000;
        setAmount((prev) => Math.min(prev, max));
      })
      .catch(() => setApiError('Failed to load your eligibility data. Please refresh.'))
      .finally(() => setIsLoading(false));
  }, []);

  const minAmount      = 50_000;
  const maxAmount      = snap?.maxAdvanceAmount ?? 900_000;
  const safeMax        = Math.max(minAmount, maxAmount);
  const effectiveAmount = Math.min(Math.max(minAmount, amount), safeMax);
  const isExhausted    = safeMax <= minAmount;
  const isUnverified   = user?.verificationStatus !== 'verified';
  const isDisabled     = isExhausted || isUnverified || submitting;

  const fee   = 3_000;
  const total = effectiveAmount + fee;

  // Slider fill (CSS custom property)
  const sliderPct = isExhausted
    ? '0%'
    : `${((effectiveAmount - minAmount) / (safeMax - minAmount)) * 100}%`;

  const repaymentLabel = useMemo(() => {
    const now = new Date();
    return `28 ${now.toLocaleString('en-GB', { month: 'short' })} ${now.getFullYear()}`;
  }, []);

  // Quick preset chips
  const presets = useMemo(() => {
    if (isExhausted) return [];
    const snap25 = Math.round(safeMax * 0.25 / 10_000) * 10_000;
    const snap50 = Math.round(safeMax * 0.5  / 10_000) * 10_000;
    const snap75 = Math.round(safeMax * 0.75 / 10_000) * 10_000;
    return [
      { label: '25%', value: Math.max(minAmount, snap25) },
      { label: '50%', value: Math.max(minAmount, snap50) },
      { label: '75%', value: Math.max(minAmount, snap75) },
      { label: 'Max', value: safeMax },
    ];
  }, [safeMax, minAmount, isExhausted]);

  // Progress bar for the earned salary stat
  const earnedPct = snap
    ? Math.min(100, Math.round(((snap.daysWorked ?? 0) / (snap.daysInMonth ?? 30)) * 100))
    : 0;

  const handleConfirm = async () => {
    if (isDisabled) return;
    setApiError('');
    setSubmitting(true);
    try {
      const { data } = await createAdvance({ amountUgx: effectiveAmount, provider });
      navigate('/confirmation', {
        state: {
          success: true,
          amount: data.amountUgx,
          fee: data.feeUgx,
          total: data.totalRepaymentUgx,
          repaymentDate: data.repaymentDateLabel,
          provider: data.provider,
          reference: data.reference,
        },
      });
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Transaction failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <AdvanceSkeleton />;
  if (!user) return null;

  const masked = maskPhone(user.phone);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      {/* ── Top Bar ───────────────────────────────────────────── */}
      <header
        className="top-bar"
        style={{ paddingLeft: 'calc(var(--sidebar-width) + var(--container-margin-desktop))' }}
      >
        <div className="top-bar-left">
          <div className="top-bar-logo">
            <div className="top-bar-logo-icon"><Building2 size={24} /></div>
            <span className="top-bar-logo-text">GovPay Uganda</span>
          </div>
        </div>
        <div className="top-bar-right">
          <nav className="top-bar-nav">
            <button className="top-bar-nav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="top-bar-nav-item active">Salary Advance</button>
            <button className="top-bar-nav-item" onClick={() => navigate('/history')}>History</button>
          </nav>
          <div className="top-bar-actions">
            <Bell size={20} color="var(--on-surface-variant)" style={{ cursor: 'pointer' }} />
            <VerificationBadge size="small" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* ── Page header ──────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <div>
              <h2 className="headline-lg" style={{ marginBottom: 4 }}>Request Salary Advance</h2>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Access your earned wages instantly — no loans, no debt.
              </p>
            </div>
          </div>

          {/* ── Context stats strip ──────────────────────────── */}
          {snap && (
            <div className="advance-stats-strip">
              <div className="advance-stat-item">
                <p className="advance-stat-label">
                  <TrendingUp size={12} />
                  Earned Today
                </p>
                <p className="advance-stat-value">
                  UGX {formatUGX(snap.availableEarnedSalary ?? 0)}
                </p>
                <div className="advance-stat-bar">
                  <div className="advance-stat-bar-fill" style={{ width: `${earnedPct}%` }} />
                </div>
                <p className="advance-stat-sub">
                  {snap.daysWorked ?? 0} of {snap.daysInMonth ?? 30} days worked
                </p>
              </div>

              <div className="advance-stat-divider" />

              <div className="advance-stat-item">
                <p className="advance-stat-label">
                  <Zap size={12} />
                  Advance Limit
                </p>
                <p className="advance-stat-value" style={{ color: 'var(--secondary)' }}>
                  UGX {formatUGX(safeMax)}
                </p>
                <p className="advance-stat-sub">50% of earned salary cap</p>
              </div>

              <div className="advance-stat-divider" />

              <div className="advance-stat-item">
                <p className="advance-stat-label">
                  <Calendar size={12} />
                  Repayment Date
                </p>
                <p className="advance-stat-value">{repaymentLabel}</p>
                <p className="advance-stat-sub">Deducted from next salary</p>
              </div>
            </div>
          )}

          {/* ── Alerts ───────────────────────────────────────── */}
          {isUnverified && (
            <div className="advance-alert-bar" style={{ marginBottom: 20 }}>
              <Shield size={16} style={{ flexShrink: 0 }} />
              <span>
                Your account is pending verification. An admin must verify your identity
                before you can request an advance.
              </span>
            </div>
          )}
          {apiError && (
            <div className="advance-alert-bar" style={{ marginBottom: 20 }}>
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Advance grid ─────────────────────────────────── */}
          <div className="advance-grid">

            {/* Left column */}
            <div className="advance-left">

              {/* Amount selector card */}
              <div className="card" style={{ padding: '28px' }}>
                <div className="advance-amount-card-header">
                  <div>
                    <p
                      className="label-caps"
                      style={{ color: 'var(--on-surface-variant)', marginBottom: 4 }}
                    >
                      Select Amount
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                      Drag the slider or tap a preset below
                    </p>
                  </div>
                  <span className="advance-max-badge">
                    Max: UGX {formatUGX(safeMax)}
                  </span>
                </div>

                {/* Big amount display */}
                <div className="advance-amount-showcase">
                  <div className="advance-amount-main">
                    <span className="advance-currency-label">UGX</span>
                    <span className="advance-amount-big">{formatUGX(effectiveAmount)}</span>
                  </div>
                  {!isExhausted && (
                    <p className="advance-amount-meta">
                      You repay{' '}
                      <strong style={{ color: 'var(--on-surface)' }}>
                        UGX {formatUGX(total)}
                      </strong>{' '}
                      on {repaymentLabel}
                    </p>
                  )}
                </div>

                {/* Slider */}
                <div className="advance-slider-wrap">
                  <input
                    type="range"
                    className="range-slider"
                    min={minAmount}
                    max={safeMax}
                    step={10_000}
                    value={effectiveAmount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={isExhausted}
                    style={{ '--progress': sliderPct }}
                  />
                  <div className="range-labels">
                    <span className="range-label">UGX {formatUGX(minAmount)}</span>
                    <span className="range-label">UGX {formatUGX(safeMax)}</span>
                  </div>
                </div>

                {/* Quick presets */}
                {presets.length > 0 && (
                  <div className="advance-chip-row">
                    {presets.map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        className={`advance-chip${effectiveAmount === value ? ' active' : ''}`}
                        onClick={() => setAmount(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {isExhausted && (
                  <p style={{ fontSize: 13, color: 'var(--error)', marginTop: 16 }}>
                    Advance limit reached for this payroll cycle. Try again after repayment posts.
                  </p>
                )}
              </div>

              {/* Provider selector card */}
              <div className="card" style={{ padding: '24px 28px' }}>
                <p className="advance-section-title">Destination Account</p>
                <div className="advance-money-grid">
                  <MobileMoneyCard
                    provider="MTN"
                    selected={provider === 'MTN'}
                    maskedNumber={masked}
                    onSelect={setProvider}
                  />
                  <MobileMoneyCard
                    provider="Airtel"
                    selected={provider === 'Airtel'}
                    maskedNumber={masked}
                    onSelect={setProvider}
                  />
                </div>
              </div>
            </div>

            {/* Right column — summary */}
            <div>
              <div className="advance-summary-card" style={{ position: 'sticky', top: '96px' }}>

                {/* Header */}
                <div className="advance-summary-header">
                  <p
                    className="label-caps"
                    style={{ opacity: 0.65, fontSize: 10, letterSpacing: '0.08em' }}
                  >
                    Advance Summary
                  </p>
                  <div className="advance-summary-you-receive">
                    <span style={{ fontSize: 12, opacity: 0.75 }}>You receive</span>
                    <span className="advance-summary-receive-amount">
                      UGX {formatUGX(effectiveAmount)}
                    </span>
                  </div>
                </div>

                {/* Breakdown rows */}
                <div className="advance-summary-rows">
                  <div className="advance-summary-row">
                    <span>Principal</span>
                    <span>UGX {formatUGX(effectiveAmount)}</span>
                  </div>
                  <div className="advance-summary-row advance-summary-row-fee">
                    <span>Bridge Fee (flat)</span>
                    <span>+ UGX {formatUGX(fee)}</span>
                  </div>
                  <div className="advance-summary-row">
                    <span>Repayment Date</span>
                    <span style={{ fontWeight: 700 }}>{repaymentLabel}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="advance-summary-total-row">
                  <span>Total Repayment</span>
                  <span>UGX {formatUGX(total)}</span>
                </div>

                {/* CTA button */}
                <button
                  type="button"
                  className="advance-confirm-btn"
                  onClick={handleConfirm}
                  disabled={isDisabled}
                >
                  {submitting ? (
                    <><span className="spinner-sm" /> Processing…</>
                  ) : (
                    <>Confirm &amp; Request <ArrowRight size={18} /></>
                  )}
                </button>

                {/* Trust signals */}
                <div className="advance-trust-row">
                  <Shield size={13} />
                  <span>Secured by government payroll · End-to-end encrypted</span>
                </div>

                <p className="advance-legal-note">
                  By confirming, you agree to the Terms of Service and Ugandan Digital Banking Regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
