import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Shield, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/useAuth.js';
import { login as apiLogin, verifyPhone as apiVerifyPhone } from '../api/auth.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // step 1 fields
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // step 2 (2FA) fields
  const [step, setStep] = useState(1);
  const [partialToken, setPartialToken] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishLogin = (accessToken, user) => {
    login(accessToken, user);
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await apiLogin({ employeeId, pin });
      if (data.requiresTwoFa) {
        setPartialToken(data.partialToken);
        setStep(2);
      } else {
        finishLogin(data.accessToken, data.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid Employee ID or PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await apiVerifyPhone(partialToken, phone);
      finishLogin(data.accessToken, data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Phone number does not match our records.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setPartialToken('');
    setPhone('');
    setError('');
  };

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="auth-header">
        <div className="top-bar-logo">
          <div className="top-bar-logo-icon">
            <Building2 size={24} />
          </div>
          <span className="top-bar-logo-text">GovPay Uganda</span>
        </div>
      </header>

      {/* Main */}
      <main className="auth-main">
        <div className="auth-card-container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div className="pill-badge pill-badge-green">
              <Shield size={18} />
              <span>Official Ministry of Finance Portal</span>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '40px 48px' }}>

              {/* Step indicator */}
              {step === 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={goBack}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>✓</span>
                    <div style={{ width: '32px', height: '2px', background: 'var(--secondary)' }} />
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>2</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '32px' }}>
                <h1 className="headline-lg" style={{ marginBottom: '8px' }}>
                  {step === 1 ? 'Secure Login' : 'Verify Your Identity'}
                </h1>
                <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                  {step === 1
                    ? 'Access your salary bridge and financial benefits safely.'
                    : 'Enter your registered mobile number to complete sign-in.'}
                </p>
              </div>

              {error && (
                <div className="info-box" style={{ borderColor: 'var(--error-container)', background: 'var(--error-container)', marginBottom: '24px' }}>
                  <p className="body-md" style={{ color: 'var(--on-error-container)', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* ── Step 1: Employee ID + PIN ── */}
              {step === 1 && (
                <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="employee-id">Employee ID / IPPS No.</label>
                    <div className="input-with-icon">
                      <span className="input-icon"><Building2 size={20} /></span>
                      <input
                        id="employee-id"
                        className="input-field"
                        type="text"
                        placeholder="Enter your official ID"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" htmlFor="password">Security PIN / Password</label>
                      <a href="#" className="label-caps" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '11px' }}>
                        Forgot PIN?
                      </a>
                    </div>
                    <div className="input-with-icon">
                      <span className="input-icon"><Lock size={20} /></span>
                      <input
                        id="password"
                        className="input-field"
                        type={showPin ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        style={{ paddingRight: '48px' }}
                        required
                      />
                      <button
                        type="button"
                        className="input-toggle"
                        onClick={() => setShowPin(!showPin)}
                        aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ paddingTop: '8px' }}>
                    <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Signing in…' : 'Login to SalaryBridge'}
                      {!isSubmitting && <ArrowRight size={20} />}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Step 2: Phone (2FA) ── */}
              {step === 2 && (
                <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="info-box" style={{ marginBottom: '8px' }}>
                    <Shield size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <p className="body-md" style={{ margin: 0 }}>
                      Two-factor authentication is enabled. Enter the mobile number registered to your account.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone-2fa">Registered Mobile Number</label>
                    <div className="input-with-icon">
                      <span className="input-icon"><Phone size={20} /></span>
                      <input
                        id="phone-2fa"
                        className="input-field"
                        type="tel"
                        placeholder="07XX XXX XXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div style={{ paddingTop: '8px' }}>
                    <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Verifying…' : 'Confirm & Sign In'}
                      {!isSubmitting && <ArrowRight size={20} />}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--outline-variant)', textAlign: 'center' }}>
                <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                  New to the portal?{' '}
                  <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    Sign Up as Public Servant
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="info-box" style={{ marginTop: '32px' }}>
            <Shield size={20} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <p className="info-box-text">
              Security Tip: GovPay Uganda will never ask for your PIN over the phone or SMS. Always ensure the URL matches the official .gov.ug domain before entering credentials.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <div className="auth-footer-inner">
          <div>
            <div className="headline-md" style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>GovPay Uganda</div>
            <p className="auth-footer-text">&copy; 2024 Government Pay Uganda. Secured by Ministry of Finance.</p>
          </div>
          <div className="auth-footer-links">
            <a href="#" className="auth-footer-link">Terms of Service</a>
            <a href="#" className="auth-footer-link">Privacy Policy</a>
            <a href="#" className="auth-footer-link">Security Standards</a>
            <a href="#" className="auth-footer-link">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
