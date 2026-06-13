import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, Building2, Wallet, User, ArrowRight, PiggyBank, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import VerificationBadge from '../components/VerificationBadge';
import { useAuth } from '../context/useAuth.js';
import { getDashboard } from '../api/users.js';
import { DashboardSkeleton } from '../components/Skeleton.jsx';
import { formatUGX, maskPhone } from '../lib/format.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [snap, setSnap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((res) => setSnap(res.data))
      .catch(() => setError('Failed to load dashboard data. Please refresh.'))
      .finally(() => setIsLoading(false));
  }, []);

  const limitPct = useMemo(() => {
    if (!user || !snap) return 0;
    const cap = Math.max(1, Math.min(900_000, Math.floor(user.monthlySalaryUgx * 0.5)));
    return Math.min(100, Math.round((snap.exposureThisMonth / cap) * 100));
  }, [user, snap]);

  const strokeDashoffset = useMemo(() => {
    const circumference = 251.2;
    return circumference * (1 - limitPct / 100);
  }, [limitPct]);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="info-box" style={{ maxWidth: '400px' }}>
            <p className="body-md" style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user || !snap) return null;

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
            <button className="top-bar-nav-item active" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="top-bar-nav-item" onClick={() => navigate('/dashboard/advance')}>Salary Advance</button>
            <button className="top-bar-nav-item" onClick={() => navigate('/history')}>History</button>
          </nav>
          <div className="top-bar-actions">
            <Bell size={20} color="var(--on-surface-variant)" style={{ cursor: 'pointer' }} />
            <VerificationBadge size="small" />
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary-fixed-dim)', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="var(--primary)" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Welcome Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="headline-md" style={{ fontWeight: 600 }}>{user.fullName}</span>
                  <VerificationBadge />
                </div>
                <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                  Good morning. Your earned income is ready for access.
                </p>
              </div>
              <div className="momo-linked-badge" style={{ flexShrink: 0 }}>
                <div className="momo-icon-box">
                  <Shield size={24} color="var(--mtn-yellow)" style={{ fill: 'var(--mtn-yellow)' }} />
                </div>
                <div>
                  <p className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Linked MoMo Account</p>
                  <p className="body-md" style={{ fontWeight: 700 }}>{maskPhone(user.phone)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Bento Grid */}
          <div className="dashboard-grid">
            {/* Hero Card */}
            <div className="dashboard-hero-card">
              <div className="bg-blob" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <p className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>Available Earned Salary</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="currency-symbol" style={{ color: 'var(--secondary)' }}>UGX</span>
                      <span className="display-balance" style={{ fontSize: '56px', color: 'var(--on-surface)' }}>
                        {formatUGX(snap.availableEarnedSalary)}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Days Worked</p>
                    <span className="headline-lg" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      {snap.daysWorked} / {snap.daysInMonth}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-gutter)', marginBottom: '32px' }}>
                  <div className="dashboard-sub-card">
                    <p className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px', fontSize: '11px' }}>Eligible Withdrawal</p>
                    <p className="headline-md" style={{ color: 'var(--secondary)' }}>UGX {formatUGX(snap.eligibleWithdrawal)}</p>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(194, 198, 214, 0.3)', borderRadius: 'var(--radius-full)', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.round((snap.daysWorked / snap.daysInMonth) * 100))}%`, height: '100%', background: 'var(--secondary)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </div>
                  <div className="dashboard-sub-card">
                    <p className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px', fontSize: '11px' }}>Next Pay Day</p>
                    <p className="headline-md" style={{ color: 'var(--on-surface)' }}>{snap.daysToPay} Days Left</p>
                    <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '8px', fontStyle: 'italic' }}>
                      Standard payment on {snap.nextPayDayLabel}
                    </p>
                  </div>
                </div>

                <button className="btn btn-emerald" style={{ padding: '16px 48px' }} onClick={() => navigate('/dashboard/advance')}>
                  <Send size={20} />
                  Request Advance
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px', color: 'rgba(66, 70, 84, 0.8)' }}>
                  <Shield size={18} />
                  <p style={{ fontSize: '13px' }}>You are accessing income you have already earned. No debt, just your salary.</p>
                </div>
              </div>
            </div>

            {/* Repayment Tracking Card */}
            <div className="dashboard-repayment-card">
              <h3 className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>Repayment Tracking</h3>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                  <svg width="160" height="160" viewBox="0 0 100 100">
                    <circle className="progress-ring-bg" cx="50" cy="50" r="40" fill="transparent" strokeWidth="8" />
                    <circle className="progress-ring-fill" cx="50" cy="50" r="40" fill="transparent" strokeWidth="8"
                      strokeDasharray="251.2" strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="headline-lg" style={{ fontWeight: 700 }}>{limitPct}%</span>
                    <span className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', fontWeight: 700 }}>Limit Used</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Outstanding (this cycle)</p>
                  <p className="headline-md">UGX {formatUGX(snap.exposureThisMonth)}</p>
                </div>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--on-surface-variant)' }}>Bridge Fee</span>
                  <span style={{ fontWeight: 700 }}>UGX {snap.currentAdvance ? formatUGX(snap.currentAdvance.feeUgx) : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--on-surface-variant)' }}>Deduction Date</span>
                  <span style={{ fontWeight: 700 }}>{snap.currentAdvance?.repaymentDateLabel ?? snap.nextPayDayLabel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(194, 198, 214, 0.3)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Status</span>
                  <span className="pill-badge pill-badge-green" style={{ padding: '4px 12px', fontSize: '11px' }}>On Track</span>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="dashboard-transactions-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Recent Activity</h3>
                <button className="label-caps" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => navigate('/history')}>
                  View History
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {snap.recentLedger.length === 0 ? (
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>No recent activity. Your advances will appear here.</p>
                ) : (
                  snap.recentLedger.slice(0, 2).map((tx) => (
                    <div key={tx.id} className="transaction-item">
                      <div className="transaction-item-left">
                        <div className="transaction-icon-box" style={{
                          background: tx.kind === 'advance' ? 'var(--secondary-container)' : 'rgba(11, 94, 215, 0.1)'
                        }}>
                          {tx.kind === 'advance'
                            ? <Wallet size={24} color="var(--on-secondary-container)" />
                            : <ArrowRight size={24} color="var(--primary)" style={{ transform: 'rotate(180deg)' }} />
                          }
                        </div>
                        <div>
                          <p className="transaction-name">{tx.description}</p>
                          <p className="transaction-meta">{tx.meta}</p>
                        </div>
                      </div>
                      <p className="headline-md" style={{ color: tx.kind === 'advance' ? 'var(--on-surface)' : 'var(--secondary)' }}>
                        {tx.kind === 'advance' ? '-' : '+'}{formatUGX(tx.amountUgx)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Wellness */}
            <div className="dashboard-wellness-card">
              <div style={{ background: 'var(--primary-container)', borderRadius: 'var(--radius-xl)', padding: '32px', color: 'var(--on-primary)', position: 'relative', overflow: 'hidden', flex: 1, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, marginBottom: '16px' }}>
                    COMING SOON
                  </div>
                  <h3 className="headline-md" style={{ marginBottom: '8px' }}>Financial Wellness Coaching</h3>
                  <p className="body-md" style={{ opacity: 0.8 }}>Learn how to grow your wealth with tailored advice for Ugandan public servants.</p>
                </div>
              </div>
              <div style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                  <PiggyBank size={32} />
                </div>
                <div>
                  <h4 className="body-md" style={{ fontWeight: 700, marginBottom: '4px' }}>Auto-Savings</h4>
                  <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Set aside a portion of your earned salary automatically every month.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer style={{ marginTop: '48px', borderTop: '1px solid var(--outline-variant)', paddingTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-gutter)' }}>
            <div>
              <h4 className="headline-md" style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '16px' }}>GovPay Uganda</h4>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: '400px' }}>The official secure portal for earned wage access for the Ugandan public service sector.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
                <a href="#" className="auth-footer-link">Terms of Service</a>
                <a href="#" className="auth-footer-link">Privacy Policy</a>
                <a href="#" className="auth-footer-link">Support</a>
              </div>
              <p className="label-caps" style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>&copy; 2024 Government Pay Uganda. Secured by Ministry of Finance.</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
