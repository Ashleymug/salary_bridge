import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Building2, Bell, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import VerificationBadge from '../components/VerificationBadge';

function formatUGX(amount) {
  return amount.toLocaleString('en-UG');
}

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state || {};

  const [simulateError, setSimulateError] = useState(false);

  const reference = data.reference ?? '—';

  const isSuccess = !simulateError && data.success !== false;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      {/* Top Bar */}
      <header className="top-bar" style={{ paddingLeft: 'calc(var(--sidebar-width) + var(--container-margin-desktop))' }}>
        <div className="top-bar-left">
          <div className="top-bar-logo">
            <div className="top-bar-logo-icon">
              <Building2 size={24} />
            </div>
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Simulate Error Toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--on-surface-variant)' }}>
                <input
                  type="checkbox"
                  checked={simulateError}
                  onChange={(e) => setSimulateError(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Simulate Error
              </label>
            </div>

            {isSuccess ? (
              /* Success State */
              <div className="status-card">
                <div className="status-card-header success">
                  <div className="status-icon">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="status-heading">Transaction Successful</h2>
                  <p className="status-subtext">
                    UGX {formatUGX(data.amount || 0)} has been sent to your mobile wallet.
                  </p>
                </div>
                <div className="status-card-body">
                  <div className="status-details">
                    <div>
                      <p className="status-detail-label">Transaction ID</p>
                      <p className="status-detail-value">{reference}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="status-detail-label">Date & Time</p>
                      <p className="status-detail-value">
                        {new Date().toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}, {new Date().toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="status-detail-label">Advance Amount</p>
                      <p className="status-detail-value">UGX {formatUGX(data.amount || 0)}</p>
                    </div>
                    <div>
                      <p className="status-detail-label">Processing Fee</p>
                      <p className="status-detail-value">UGX {formatUGX(data.fee || 0)}</p>
                    </div>
                    <div>
                      <p className="status-detail-label">Total Repayment</p>
                      <p className="status-detail-value">UGX {formatUGX(data.total || 0)}</p>
                    </div>
                    <div>
                      <p className="status-detail-label">Repayment Date</p>
                      <p className="status-detail-value">{data.repaymentDate || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="status-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate('/dashboard')}
                    >
                      Return to Dashboard
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                    Need help?{' '}
                    <a href="#" style={{ color: 'var(--primary)' }}>Contact Support</a>
                  </p>
                </div>
              </div>
            ) : (
              /* Error State */
              <div className="status-card">
                <div className="status-card-header error">
                  <div className="status-icon">
                    <XCircle size={40} />
                  </div>
                  <h2 className="status-heading">Transaction Failed</h2>
                  <p className="status-subtext">
                    We were unable to process your advance request.
                  </p>
                </div>
                <div className="status-card-body">
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', marginBottom: '24px' }}>
                    An error occurred while processing your transaction. This may be due to a network issue or insufficient funds in your account. Please try again or contact support.
                  </p>
                  <div className="status-actions">
                    <button
                      type="button"
                      className="btn btn-emerald"
                      onClick={() => navigate('/dashboard/advance')}
                    >
                      Try Again
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                    Need help?{' '}
                    <a href="#" style={{ color: 'var(--primary)' }}>Contact Support</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}