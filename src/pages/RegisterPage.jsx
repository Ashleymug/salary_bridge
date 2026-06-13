import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Zap, ArrowRight, ChevronDown, CheckCircle2, MapPin, CreditCard, Phone, Lock } from 'lucide-react';
import { useAuth } from '../context/useAuth.js';
import { register as apiRegister } from '../api/auth.js';

const MINISTRIES = [
  'Ministry of Public Service',
  'Ministry of Education',
  'Ministry of Health',
  'Ministry of Finance',
  'Uganda Police Force',
  'District Local Government',
];

const JOB_CATEGORIES = [
  'Teacher / Educator',
  'Nurse / Health Worker',
  'Police Officer',
  'Administrative Officer',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showOverlay, setShowOverlay] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    ministry: MINISTRIES[0],
    jobCategory: JOB_CATEGORIES[0],
    district: '',
    salary: '',
    phone: '',
    provider: 'MTN',
    pin: '',
    agreeTerms: false,
  });

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Client-side validation
    if (formData.pin.length < 4) {
      setSubmitError('PIN must be at least 4 digits.');
      return;
    }
    if (!formData.agreeTerms) {
      setSubmitError('You must agree to the Terms of Service.');
      return;
    }

    setIsSubmitting(true);
    setShowOverlay(true);

    try {
      const salaryNum = Number(String(formData.salary).replace(/,/g, '')) || 0;
      const { data } = await apiRegister({
        employeeId: formData.employeeId,
        fullName: formData.fullName,
        ministry: formData.ministry,
        jobCategory: formData.jobCategory,
        district: formData.district,
        monthlySalaryUgx: salaryNum,
        phone: formData.phone,
        provider: formData.provider,
        pin: formData.pin,
      });

      // Auto-login after registration
      login(data.accessToken, data.user);

      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } catch (err) {
      setShowOverlay(false);
      setSubmitError(
        err.response?.data?.detail || 'Registration failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="auth-header" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', background: 'var(--surface-container-lowest)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="top-bar-logo-text">GovPay Uganda</span>
        </div>
        <div>
          <Link to="/login" className="body-md" style={{ color: 'var(--primary)' }}>
            Already have an account? Login
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="auth-main" style={{ padding: '40px 16px' }}>
        <div className="register-grid">
          {/* Left Panel */}
          <div className="register-left">
            <div className="register-left-content">
              <h2>Empowering Ugandan Public Servants</h2>
              <p>Register to access secure salary advances, track your earnings, and manage your financial future with confidence.</p>
              <div className="register-feature">
                <div className="register-feature-icon"><Shield size={24} /></div>
                <div>
                  <p className="register-feature-label">Government Trusted</p>
                  <p className="register-feature-value">MoPS Verified</p>
                </div>
              </div>
              <div className="register-feature">
                <div className="register-feature-icon"><Zap size={24} /></div>
                <div>
                  <p className="register-feature-label">Instant Access</p>
                  <p className="register-feature-value">Fast Verification</p>
                </div>
              </div>
            </div>
            <div className="register-image-box" />
          </div>

          {/* Right Panel — Form */}
          <div className="register-right">
            <h1 className="headline-lg" style={{ marginBottom: '8px' }}>Create Your Account</h1>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: '40px' }}>
              Please provide your personal and official identification details.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {submitError && (
                <div className="info-box" style={{ borderColor: 'var(--error-container)', background: 'var(--error-container)' }}>
                  <p className="body-md" style={{ color: 'var(--on-error-container)', margin: 0 }}>{submitError}</p>
                </div>
              )}

              {/* Row 1: Full Name + Employee ID */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name (as on ID)</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="John Katende"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID / IPPS Number</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="IPPS-000000"
                    value={formData.employeeId}
                    onChange={(e) => handleChange('employeeId', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Ministry + Job Category */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Ministry / Department</label>
                  <div className="select-wrapper">
                    <select value={formData.ministry} onChange={(e) => handleChange('ministry', e.target.value)}>
                      {MINISTRIES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <span className="select-icon"><ChevronDown size={20} /></span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Category</label>
                  <div className="select-wrapper">
                    <select value={formData.jobCategory} onChange={(e) => handleChange('jobCategory', e.target.value)}>
                      {JOB_CATEGORIES.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                    <span className="select-icon"><ChevronDown size={20} /></span>
                  </div>
                </div>
              </div>

              {/* Row 3: District + Salary */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">District of Service</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><MapPin size={20} /></span>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="Kampala"
                      value={formData.district}
                      onChange={(e) => handleChange('district', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Salary (UGX)</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><CreditCard size={20} /></span>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="1,500,000"
                      value={formData.salary}
                      onChange={(e) => handleChange('salary', e.target.value)}
                      required
                      min={100000}
                      style={{ paddingLeft: '48px' }}
                    />
                    <span className="input-right" style={{ left: '14px', right: 'auto', fontFamily: 'var(--font-work-sans)', color: 'var(--outline)', fontWeight: 500 }}>
                      UGX
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone + Provider */}
              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Mobile Phone Number</label>
                    <div className="input-with-icon">
                      <span className="input-icon"><Phone size={20} /></span>
                      <input
                        className="input-field"
                        type="tel"
                        placeholder="0700 000 000"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Money Provider</label>
                    <div className="radio-group">
                      {['MTN', 'Airtel'].map((p) => (
                        <label key={p} className={`radio-option ${formData.provider === p ? 'checked' : ''}`}>
                          <input
                            type="radio"
                            name="provider"
                            value={p}
                            checked={formData.provider === p}
                            onChange={(e) => handleChange('provider', e.target.value)}
                          />
                          <span className="radio-option-text">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PIN */}
              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Create Password</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Lock size={20} /></span>
                    <input
                      className="input-field"
                      type="password"
                      placeholder="Enter a secure password"
                      value={formData.pin}
                      onChange={(e) => handleChange('pin', e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
                    This password will be required to log in and authorise transactions.
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                  required
                />
                <label htmlFor="terms">
                  I agree to the <a href="#" style={{ color: 'var(--primary)' }}>Terms of Service</a> and acknowledge that GovPay Uganda will verify my employment status with the Ministry of Public Service.
                </label>
              </div>

              {/* Submit */}
              <div style={{ paddingTop: '16px' }}>
                <button type="submit" className="btn btn-primary btn-full" style={{ justifyContent: 'center' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Registering…' : 'Register'}
                  {!isSubmitting && <ArrowRight size={20} />}
                </button>
              </div>
            </form>

            <div className="info-box" style={{ marginTop: '48px' }}>
              <CheckCircle2 size={24} color="var(--secondary)" style={{ flexShrink: 0 }} />
              <div>
                <h4 className="body-md" style={{ fontWeight: 600, color: 'var(--secondary)', marginBottom: '4px' }}>Why verify?</h4>
                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                  Verification connects your account directly to the government payroll system, enabling instant salary advances without credit checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer" style={{ background: 'var(--surface-container-low)' }}>
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

      {/* Spinner Overlay */}
      {showOverlay && (
        <div className="spinner-overlay">
          <div className="spinner-overlay-bg" />
          <div className="spinner-content">
            <div className="spinner-animation" />
            <p className="headline-md" style={{ color: 'var(--primary)' }}>Verifying Employee Details...</p>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>
              Connecting to Ministry of Public Service
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
