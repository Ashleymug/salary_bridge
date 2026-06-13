import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Bell, ArrowRight, User, Shield, Smartphone,
  Lock, CheckCircle2, Eye, EyeOff, AlertTriangle, XCircle, ShieldCheck, ShieldOff,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import VerificationBadge from '../components/VerificationBadge';
import { useAuth } from '../context/useAuth.js';
import { formatUGX, maskPhone } from '../lib/format.js';
import { toggle2FA, changePin } from '../api/users.js';

/* ── Tiny reusable components ─────────────────────────────── */

function StatusBadge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '99px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
      background: active ? 'var(--secondary-container)' : 'var(--surface-container-high)',
      color:      active ? 'var(--secondary)'           : 'var(--on-surface-variant)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {active ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
}

function InlineBanner({ type, children }) {
  const styles = {
    success: { bg: 'var(--secondary-container)', color: 'var(--secondary)',            icon: <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> },
    error:   { bg: 'var(--error-container)',     color: 'var(--on-error-container)',   icon: <XCircle      size={16} style={{ flexShrink: 0 }} /> },
    warning: { bg: '#fff3cd',                    color: '#7a5c00',                     icon: <AlertTriangle size={16} style={{ flexShrink: 0 }} /> },
  };
  const s = styles[type];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px', borderRadius: 'var(--radius-md)',
      background: s.bg, color: s.color, fontSize: '14px',
    }}>
      {s.icon}
      <span>{children}</span>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  /* Change PIN */
  const [showPinForm,    setShowPinForm]    = useState(false);
  const [currentPin,     setCurrentPin]     = useState('');
  const [newPin,         setNewPin]         = useState('');
  const [confirmPin,     setConfirmPin]     = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin,     setShowNewPin]     = useState(false);
  const [pinStatus,      setPinStatus]      = useState(null); // { type: 'success'|'error', msg }
  const [isChangingPin,  setIsChangingPin]  = useState(false);

  /* 2FA */
  const [confirmDisable,   setConfirmDisable]   = useState(false);
  const [twoFaStatus,      setTwoFaStatus]      = useState(null); // { type, msg }
  const [isTogglingTwoFa,  setIsTogglingTwoFa]  = useState(false);

  if (!user) return null;

  const verificationMessage = {
    verified:       { text: 'Your employment has been verified with the Ministry of Public Service. Your identity is confirmed biometrically.', color: 'var(--secondary)' },
    pending:        { text: 'Your account is awaiting verification. An admin will review your details shortly.',                                color: 'var(--tertiary)' },
    document_error: { text: 'There was an issue with your submitted documents. Please contact support to re-upload.',                          color: 'var(--error)' },
  };
  const verMsg = verificationMessage[user.verificationStatus] ?? verificationMessage.pending;

  /* PIN match helpers */
  const pinsMatch    = confirmPin.length > 0 && newPin === confirmPin;
  const pinsMismatch = confirmPin.length > 0 && newPin !== confirmPin;

  /* ── Handlers ──────────────────────────────────────────── */

  const openPinForm = () => {
    setShowPinForm(true);
    setPinStatus(null);
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
  };

  const closePinForm = () => {
    setShowPinForm(false);
    setPinStatus(null);
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinStatus(null);
    if (newPin !== confirmPin) { setPinStatus({ type: 'error', msg: 'New PIN and confirmation do not match.' }); return; }
    if (newPin.length < 4)     { setPinStatus({ type: 'error', msg: 'New PIN must be at least 4 digits.' }); return; }
    if (!/^\d+$/.test(newPin)) { setPinStatus({ type: 'error', msg: 'PIN must contain digits only (0–9).' }); return; }

    setIsChangingPin(true);
    try {
      await changePin(currentPin, newPin);
      setPinStatus({ type: 'success', msg: 'Your security PIN has been updated successfully.' });
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
      setTimeout(closePinForm, 2500);
    } catch (err) {
      setPinStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to update PIN. Please try again.' });
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleToggle2FA = async (confirmed = false) => {
    /* Disabling 2FA requires a second click to confirm */
    if (user.twoFaEnabled && !confirmed) {
      setConfirmDisable(true);
      setTwoFaStatus(null);
      return;
    }
    setTwoFaStatus(null);
    setConfirmDisable(false);
    setIsTogglingTwoFa(true);
    try {
      const { data } = await toggle2FA();
      await refreshUser();
      setTwoFaStatus({ type: 'success', msg: data.message });
      setTimeout(() => setTwoFaStatus(null), 5000);
    } catch (err) {
      setTwoFaStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to update 2FA setting. Please try again.' });
    } finally {
      setIsTogglingTwoFa(false);
    }
  };

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
        <div className="dashboard-content">
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <div>
              <h2 className="headline-lg" style={{ marginBottom: '4px' }}>Account Settings</h2>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Manage your profile, security, and linked accounts.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)' }}>

            {/* Profile */}
            <div className="card" style={{ padding: 'var(--space-gutter)' }}>
              <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="var(--primary)" />
                Profile Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="input-field" type="text" value={user.fullName} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID / IPPS</label>
                  <input className="input-field" type="text" value={user.employeeId} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Ministry / Department</label>
                  <input className="input-field" type="text" value={user.ministry} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">District of Service</label>
                  <input className="input-field" type="text" value={user.district} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Salary (UGX)</label>
                  <input className="input-field" type="text" value={formatUGX(user.monthlySalaryUgx)} readOnly />
                </div>
              </div>
            </div>

            {/* Linked Mobile Money */}
            <div className="card" style={{ padding: 'var(--space-gutter)' }}>
              <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={20} color="var(--secondary)" />
                Linked Mobile Money
              </h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={`mobile-money-card ${user.provider === 'MTN' ? 'selected' : ''}`} style={{ flex: 1, cursor: 'default' }}>
                  <div className="mobile-money-logo mtn">MTN</div>
                  <div>
                    <p className="mobile-money-name">MTN Mobile Money</p>
                    <p className="mobile-money-number">{user.provider === 'MTN' ? maskPhone(user.phone) : '—'}</p>
                  </div>
                  <div className="radio-indicator" />
                </div>
                <div className={`mobile-money-card ${user.provider === 'Airtel' ? 'selected' : ''}`} style={{ flex: 1, cursor: 'default' }}>
                  <div className="mobile-money-logo airtel">AIRTEL</div>
                  <div>
                    <p className="mobile-money-name">Airtel Money</p>
                    <p className="mobile-money-number">{user.provider === 'Airtel' ? maskPhone(user.phone) : '—'}</p>
                  </div>
                  <div className="radio-indicator" />
                </div>
              </div>
            </div>

            {/* ════ SECURITY ════════════════════════════════════ */}
            <div className="card" style={{ padding: 'var(--space-gutter)' }}>
              <h3 className="headline-md" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} color="var(--error)" />
                Security
              </h3>

              {/* ── Change PIN ─────────────────────────────────── */}
              <div style={{
                borderBottom: '1px solid var(--outline-variant)',
                paddingBottom: showPinForm ? '24px' : '20px',
                marginBottom: '20px',
                transition: 'padding-bottom 0.2s',
              }}>
                {/* Row: label + button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="body-md" style={{ fontWeight: 600 }}>Change Security PIN</p>
                    <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                      {showPinForm ? 'Fill in the form below and click Save New PIN' : 'Update your 4–6 digit security PIN'}
                    </p>
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '8px 20px', flexShrink: 0, minWidth: '90px' }}
                    onClick={showPinForm ? closePinForm : openPinForm}
                  >
                    {showPinForm ? 'Cancel' : 'Update'}
                  </button>
                </div>

                {/* Expandable PIN form */}
                <div className={`settings-expand ${showPinForm ? 'open' : 'closed'}`}>
                  <form onSubmit={handleChangePin} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Banner */}
                    {pinStatus && <InlineBanner type={pinStatus.type}>{pinStatus.msg}</InlineBanner>}

                    {/* Current PIN */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Current PIN</label>
                      <div className="input-with-icon">
                        <span className="input-icon"><Lock size={18} /></span>
                        <input
                          className="input-field"
                          type={showCurrentPin ? 'text' : 'password'}
                          placeholder="Enter your current PIN"
                          value={currentPin}
                          onChange={(e) => setCurrentPin(e.target.value)}
                          required
                          style={{ paddingRight: '48px' }}
                        />
                        <button type="button" className="input-toggle" onClick={() => setShowCurrentPin(v => !v)}>
                          {showCurrentPin ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* New + Confirm side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">New PIN</label>
                        <div className="input-with-icon">
                          <span className="input-icon"><Lock size={18} /></span>
                          <input
                            className="input-field"
                            type={showNewPin ? 'text' : 'password'}
                            placeholder="4–6 digits"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            required
                            style={{ paddingRight: '48px' }}
                          />
                          <button type="button" className="input-toggle" onClick={() => setShowNewPin(v => !v)}>
                            {showNewPin ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Confirm New PIN
                          {pinsMatch    && <CheckCircle2 size={13} color="var(--secondary)" />}
                          {pinsMismatch && <XCircle      size={13} color="var(--error)"     />}
                        </label>
                        <input
                          className="input-field"
                          type="password"
                          placeholder="Re-enter new PIN"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          required
                          style={{
                            borderColor: pinsMismatch ? 'var(--error)' : pinsMatch ? 'var(--secondary)' : undefined,
                            outline:     pinsMismatch ? '2px solid var(--error)' : pinsMatch ? '2px solid var(--secondary)' : undefined,
                          }}
                        />
                        {pinsMismatch && <p style={{ fontSize: '12px', color: 'var(--error)',     marginTop: '4px' }}>PINs do not match</p>}
                        {pinsMatch    && <p style={{ fontSize: '12px', color: 'var(--secondary)', marginTop: '4px' }}>PINs match ✓</p>}
                      </div>
                    </div>

                    {/* Submit */}
                    <div style={{ paddingTop: '4px' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '10px 28px', display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '148px' }}
                        disabled={isChangingPin || pinsMismatch || !currentPin || !newPin || !confirmPin}
                      >
                        {isChangingPin
                          ? <><span className="spinner-sm" /> Saving…</>
                          : 'Save New PIN'
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* ── Two-Factor Authentication ───────────────────── */}
              <div>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <p className="body-md" style={{ fontWeight: 600 }}>Two-Factor Authentication</p>
                      <StatusBadge active={!!user.twoFaEnabled} />
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>
                      {user.twoFaEnabled
                        ? 'Phone verification is required after entering your PIN on each login.'
                        : 'Add a phone verification step after your PIN for extra security.'}
                    </p>
                  </div>

                  {/* Enable / Disable button — hidden while confirm dialog is open */}
                  {!confirmDisable && (
                    <button
                      className={`btn ${user.twoFaEnabled ? 'btn-outline' : 'btn-primary'}`}
                      style={{
                        padding: '8px 20px', flexShrink: 0, minWidth: '100px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}
                      onClick={() => handleToggle2FA(false)}
                      disabled={isTogglingTwoFa}
                    >
                      {isTogglingTwoFa ? (
                        <>
                          <span className={user.twoFaEnabled ? 'spinner-sm-dark' : 'spinner-sm'} />
                          {user.twoFaEnabled ? 'Disabling…' : 'Enabling…'}
                        </>
                      ) : (
                        <>
                          {user.twoFaEnabled
                            ? <><ShieldOff  size={15} /> Disable</>
                            : <><ShieldCheck size={15} /> Enable</>
                          }
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Feedback banner */}
                {twoFaStatus && (
                  <div style={{ marginTop: '12px' }}>
                    <InlineBanner type={twoFaStatus.type}>{twoFaStatus.msg}</InlineBanner>
                  </div>
                )}

                {/* Inline disable confirmation */}
                {confirmDisable && (
                  <div style={{
                    marginTop: '14px',
                    padding: '16px 18px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--error-container)',
                    border: '1px solid rgba(186,26,26,0.2)',
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <AlertTriangle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-error-container)', marginBottom: '4px' }}>
                          Disable two-factor authentication?
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--on-error-container)', opacity: 0.85 }}>
                          Your account will only be protected by your PIN. This reduces your account security.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary"
                        style={{
                          padding: '8px 18px', fontSize: '13px',
                          background: 'var(--error)', borderColor: 'var(--error)',
                          display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '148px',
                        }}
                        onClick={() => handleToggle2FA(true)}
                        disabled={isTogglingTwoFa}
                      >
                        {isTogglingTwoFa
                          ? <><span className="spinner-sm" /> Disabling…</>
                          : 'Yes, disable 2FA'
                        }
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '8px 18px', fontSize: '13px' }}
                        onClick={() => setConfirmDisable(false)}
                        disabled={isTogglingTwoFa}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Status */}
            <div className="card" style={{ padding: 'var(--space-gutter)' }}>
              <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="var(--secondary)" />
                Verification Status
              </h3>
              <div className="info-box">
                <CheckCircle2 size={20} color={verMsg.color} style={{ flexShrink: 0 }} />
                <div>
                  <p className="body-md" style={{ fontWeight: 600, color: verMsg.color, textTransform: 'capitalize', marginBottom: '4px' }}>
                    {user.verificationStatus.replace('_', ' ')}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>{verMsg.text}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
