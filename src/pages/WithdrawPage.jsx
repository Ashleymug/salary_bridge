import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Bell, ArrowRight, ArrowLeft, Shield, Lock,
  Eye, EyeOff, CheckCircle2, XCircle, Banknote, Smartphone,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MobileMoneyCard from '../components/MobileMoneyCard';
import VerificationBadge from '../components/VerificationBadge';
import { useAuth } from '../context/useAuth.js';
import { getDashboard } from '../api/users.js';
import { WithdrawSkeleton } from '../components/Skeleton.jsx';
import { verifyPin } from '../api/auth.js';
import { createAdvance } from '../api/advances.js';
import { formatUGX, maskPhone } from '../lib/format.js';

const MIN_AMOUNT = 50_000;
const FEE = 3_000;

/* ── Step indicator ───────────────────────────────────────── */
function StepDot({ n, current, label }) {
  const done    = n < current;
  const active  = n === current;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '13px',
        background: done   ? 'var(--secondary)'
                  : active ? 'var(--primary)'
                  :          'var(--surface-container-high)',
        color:     done || active ? '#fff' : 'var(--on-surface-variant)',
        transition: 'background 0.25s, color 0.25s',
      }}>
        {done ? <CheckCircle2 size={16} /> : n}
      </div>
      <span style={{
        fontSize: '11px', fontWeight: active ? 700 : 500,
        color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  );
}

function StepBar({ step }) {
  const steps = ['Select Amount', 'Destination', 'Confirm & PIN'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', marginBottom: '32px' }}>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <StepDot n={i + 1} current={step} label={label} />
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: '2px', marginTop: '-16px',
              background: step > i + 1 ? 'var(--secondary)' : 'var(--outline-variant)',
              transition: 'background 0.25s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Summary row ──────────────────────────────────────────── */
function SRow({ label, value, accent, large }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--outline-variant)',
    }}>
      <span style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>{label}</span>
      <span style={{
        fontSize: large ? '18px' : '14px',
        fontWeight: large ? 800 : 600,
        color: accent || 'var(--on-surface)',
      }}>
        {value}
      </span>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function WithdrawPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [step, setStep] = useState(1);

  /* dashboard data */
  const [snap, setSnap]         = useState(null);
  const [loadErr, setLoadErr]   = useState('');
  const [isLoading, setLoading] = useState(true);

  /* step 1 */
  const [amount, setAmount] = useState(MIN_AMOUNT);

  /* step 2 */
  const [provider, setProvider] = useState(user?.provider ?? 'MTN');

  /* step 3 – PIN */
  const [pin, setPin]           = useState('');
  const [showPin, setShowPin]   = useState(false);
  const [pinError, setPinError] = useState('');
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    getDashboard()
      .then(({ data }) => {
        setSnap(data);
        const max = Math.max(MIN_AMOUNT, data.eligibleWithdrawal ?? MIN_AMOUNT);
        setAmount(Math.min(Math.floor(max / 2 / 10_000) * 10_000 || MIN_AMOUNT, max));
      })
      .catch(() => setLoadErr('Unable to load your withdrawal eligibility. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const maxAmount  = useMemo(() => Math.max(MIN_AMOUNT, snap?.eligibleWithdrawal ?? MIN_AMOUNT), [snap]);
  const clamped    = Math.min(Math.max(MIN_AMOUNT, amount), maxAmount);
  const netAmount  = clamped;
  const total      = clamped + FEE;
  const repayLabel = useMemo(() => {
    const now = new Date();
    return `28 ${now.toLocaleString('en-GB', { month: 'short' })} ${now.getFullYear()}`;
  }, []);
  const masked     = user ? maskPhone(user.phone) : '—';
  const noFunds    = !snap || snap.eligibleWithdrawal < MIN_AMOUNT;

  /* ── handlers ──────────────────────────────────────────── */

  const handleWithdraw = async () => {
    if (!pin) { setPinError('Enter your security PIN to confirm.'); return; }
    setPinError('');
    setBusy(true);
    try {
      await verifyPin(pin);
    } catch (err) {
      setPinError(err.response?.data?.detail || 'Incorrect PIN. Please try again.');
      setBusy(false);
      return;
    }
    try {
      const { data } = await createAdvance({ amountUgx: clamped, provider });
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
      setPinError(err.response?.data?.detail || 'Withdrawal failed. Please try again.');
      setBusy(false);
    }
  };

  /* ── loading / error state ─────────────────────────────── */
  if (isLoading) return <WithdrawSkeleton />;

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      {/* Top Bar */}
      <header className="top-bar" style={{ paddingLeft: 'calc(var(--sidebar-width) + var(--container-margin-desktop))' }}>
        <div className="top-bar-left">
          <div className="top-bar-logo">
            <div className="top-bar-logo-icon"><Building2 size={24} /></div>
            <span className="top-bar-logo-text">GovPay Uganda</span>
          </div>
        </div>
        <div className="top-bar-right">
          <nav className="top-bar-nav">
            <button className="top-bar-nav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="top-bar-nav-item" onClick={() => navigate('/dashboard/advance')}>Salary Advance</button>
            <button className="top-bar-nav-item" onClick={() => navigate('/history')}>History</button>
          </nav>
          <div className="top-bar-actions">
            <Bell size={20} color="var(--on-surface-variant)" style={{ cursor: 'pointer' }} />
            <VerificationBadge size="small" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content" style={{ maxWidth: '720px' }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <button className="back-button" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/dashboard')}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="headline-lg" style={{ marginBottom: '4px' }}>Withdraw Funds</h2>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Access the salary you have already earned — no loans, no interest.
              </p>
            </div>
          </div>

          {/* Not-verified banner */}
          {user.verificationStatus !== 'verified' && (
            <div className="info-box" style={{ marginBottom: '24px', background: 'var(--error-container)' }}>
              <XCircle size={20} color="var(--error)" style={{ flexShrink: 0 }} />
              <p style={{ color: 'var(--on-error-container)', fontSize: '14px' }}>
                Your account is pending verification. An admin must verify your identity before you can withdraw funds.
              </p>
            </div>
          )}

          {/* Load error */}
          {loadErr && (
            <div className="info-box" style={{ marginBottom: '24px', background: 'var(--error-container)' }}>
              <p style={{ color: 'var(--on-error-container)', fontSize: '14px' }}>{loadErr}</p>
            </div>
          )}

          {/* Step bar */}
          <StepBar step={step} />

          {/* ═══ STEP 1 — AMOUNT ══════════════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Balance overview */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px',
              }}>
                <div className="card" style={{ padding: '18px 20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Earned to Date
                  </p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--on-surface)' }}>
                    UGX {formatUGX(snap?.earnedToDate ?? 0)}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                    {snap?.daysWorked ?? 0} of {snap?.daysInMonth ?? 30} days worked
                  </p>
                </div>
                <div className="card" style={{ padding: '18px 20px', background: noFunds ? 'var(--error-container)' : 'var(--secondary-container)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', color: noFunds ? 'var(--on-error-container)' : 'var(--on-secondary-container)' }}>
                    Available to Withdraw
                  </p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: noFunds ? 'var(--error)' : 'var(--secondary)' }}>
                    UGX {formatUGX(snap?.eligibleWithdrawal ?? 0)}
                  </p>
                  <p style={{ fontSize: '12px', marginTop: '4px', color: noFunds ? 'var(--on-error-container)' : 'var(--on-secondary-container)', opacity: 0.8 }}>
                    {noFunds ? 'Limit reached for this cycle' : 'Up to 50% of earned salary'}
                  </p>
                </div>
              </div>

              {/* Slider card */}
              <div className="card" style={{ padding: 'var(--space-gutter)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>How much do you need?</p>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                      UGX 3,000 service fee applies. Repaid on {repayLabel}.
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-full)',
                    background: 'var(--surface-container)', fontSize: '11px',
                    fontWeight: 700, color: 'var(--on-surface-variant)',
                  }}>
                    Max 50% Earned
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', justifyContent: 'center' }}>
                    <span className="currency-symbol" style={{ color: 'var(--secondary)', fontSize: '20px' }}>UGX</span>
                    <span style={{ fontSize: '52px', fontWeight: 900, color: 'var(--secondary)', lineHeight: 1 }}>
                      {formatUGX(clamped)}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '8px' }}>
                    You receive: <strong>UGX {formatUGX(clamped)}</strong> — Fee: UGX {formatUGX(FEE)} — Repay: UGX {formatUGX(total)}
                  </p>
                </div>

                <input
                  type="range"
                  className="range-slider"
                  min={MIN_AMOUNT}
                  max={maxAmount}
                  step={10_000}
                  value={clamped}
                  onChange={e => setAmount(Number(e.target.value))}
                  disabled={noFunds || user.verificationStatus !== 'verified'}
                />
                <div className="range-labels">
                  <span className="range-label">UGX {formatUGX(MIN_AMOUNT)}</span>
                  <span className="range-label">UGX {formatUGX(maxAmount)}</span>
                </div>

                {/* Quick presets */}
                {!noFunds && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                    {[0.25, 0.5, 0.75, 1].map(frac => {
                      const preset = Math.min(maxAmount, Math.floor((maxAmount * frac) / 10_000) * 10_000);
                      return (
                        <button
                          key={frac}
                          type="button"
                          onClick={() => setAmount(preset)}
                          style={{
                            padding: '6px 14px', borderRadius: 'var(--radius-full)',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: clamped === preset ? 'var(--secondary)' : 'var(--outline-variant)',
                            background:  clamped === preset ? 'var(--secondary-container)' : 'transparent',
                            color:       clamped === preset ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
                            transition:  'all 0.15s',
                          }}
                        >
                          {Math.round(frac * 100)}%
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-emerald"
                style={{ alignSelf: 'flex-end', padding: '12px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => setStep(2)}
                disabled={noFunds || user.verificationStatus !== 'verified'}
              >
                Next: Select Destination <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ═══ STEP 2 — DESTINATION ═════════════════════════════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div className="card" style={{ padding: 'var(--space-gutter)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Smartphone size={20} color="var(--secondary)" />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px' }}>Select Mobile Money Account</p>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                      UGX {formatUGX(clamped)} will be sent instantly to your chosen wallet.
                    </p>
                  </div>
                </div>
                <div className="advance-money-grid">
                  <MobileMoneyCard provider="MTN"   selected={provider === 'MTN'}   maskedNumber={masked} onSelect={setProvider} />
                  <MobileMoneyCard provider="Airtel" selected={provider === 'Airtel'} maskedNumber={masked} onSelect={setProvider} />
                </div>
                <div style={{
                  marginTop: '20px', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-container-low)', fontSize: '13px', color: 'var(--on-surface-variant)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <Shield size={15} style={{ flexShrink: 0 }} />
                  Funds are sent to your registered number: <strong>{masked}</strong>. To change your number, contact support.
                </div>
              </div>

              {/* Mini summary */}
              <div className="card" style={{ padding: '18px 20px' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Amount Summary</p>
                <SRow label="Withdrawal Amount" value={`UGX ${formatUGX(clamped)}`} />
                <SRow label="Service Fee"       value={`UGX ${formatUGX(FEE)}`} />
                <SRow label="Repayment Date"    value={repayLabel} />
                <SRow label="Total Repayment"   value={`UGX ${formatUGX(total)}`} accent="var(--primary)" large />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  className="btn btn-emerald"
                  style={{ padding: '12px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => { setPinError(''); setPin(''); setStep(3); }}
                >
                  Next: Confirm <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3 — CONFIRM & PIN ═══════════════════════════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Full summary */}
              <div className="card" style={{ padding: 'var(--space-gutter)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Banknote size={20} color="var(--secondary)" />
                  <p style={{ fontWeight: 700, fontSize: '15px' }}>Withdrawal Summary</p>
                </div>
                <SRow label="Withdrawal Amount"   value={`UGX ${formatUGX(clamped)}`} />
                <SRow label="Service Fee"          value={`UGX ${formatUGX(FEE)}`} />
                <SRow label="Sent To"              value={`${provider} • ${masked}`} />
                <SRow label="Repayment Date"       value={repayLabel} />
                <SRow label="Auto-Deducted From"   value="Monthly Salary (Payroll)" />
                <div style={{ marginTop: '4px' }}>
                  <SRow label="Total Repayment"    value={`UGX ${formatUGX(total)}`} accent="var(--primary)" large />
                </div>
              </div>

              {/* PIN confirmation */}
              <div className="card" style={{ padding: 'var(--space-gutter)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Lock size={20} color="var(--error)" />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px' }}>Confirm with your Security PIN</p>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                      Enter your PIN to authorise this withdrawal.
                    </p>
                  </div>
                </div>

                {pinError && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px',
                    borderRadius: 'var(--radius-md)', background: 'var(--error-container)',
                    color: 'var(--on-error-container)', fontSize: '14px', marginBottom: '14px',
                  }}>
                    <XCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="input-with-icon" style={{ maxWidth: '320px' }}>
                  <span className="input-icon"><Lock size={18} /></span>
                  <input
                    className="input-field"
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter your PIN"
                    value={pin}
                    onChange={e => { setPin(e.target.value); setPinError(''); }}
                    onKeyDown={e => e.key === 'Enter' && !busy && handleWithdraw()}
                    autoFocus
                    style={{ paddingRight: '48px' }}
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowPin(v => !v)}>
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                  <Shield size={13} />
                  Your PIN is verified server-side and never stored by this page.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setStep(2)}
                  disabled={busy}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  className="btn btn-emerald"
                  style={{ padding: '14px 40px', display: 'inline-flex', alignItems: 'center', gap: '10px', minWidth: '200px', justifyContent: 'center' }}
                  onClick={handleWithdraw}
                  disabled={busy || !pin}
                >
                  {busy ? (
                    <><span className="spinner-sm" /> Processing…</>
                  ) : (
                    <><Banknote size={18} /> Withdraw UGX {formatUGX(clamped)}</>
                  )}
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
                By withdrawing, you agree that the total repayment of UGX {formatUGX(total)} will be deducted from your salary on {repayLabel}.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Full-screen processing overlay */}
      {busy && (
        <div className="spinner-overlay">
          <div className="spinner-overlay-bg" />
          <div className="spinner-content">
            <div className="spinner-animation" />
            <p className="headline-md" style={{ color: 'var(--primary)' }}>Processing Withdrawal…</p>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>
              Please wait while we disburse your funds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
