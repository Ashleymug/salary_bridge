import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronDown, ChevronLeft, ChevronRight, Download,
  FileText, Receipt, Search, Shield, SlidersHorizontal,
  User, Verified, Wallet, Home, X, CheckCircle2, Clock,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/useAuth.js';
import { getAdvances } from '../api/advances.js';
import { formatUGX } from '../lib/format.js';
import { downloadReceipt, downloadStatement } from '../lib/receipt.js';
import '../styles/history-page.css';
import { HistorySkeleton } from '../components/Skeleton.jsx';

function formatTableDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
}

function fmtLong(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Repayment Breakdown Modal ──────────────────────────────────── */

function BreakdownModal({ advance, user, onClose, onDownload }) {
  const [dlBusy, setDlBusy] = useState(false);

  const handleDl = async () => {
    if (dlBusy) return;
    setDlBusy(true);
    try { await onDownload(advance); }
    finally { setDlBusy(false); }
  };
  // Compute repayment date from createdAt (always day 28 of same month)
  const repayDate = new Date(advance.createdAt);
  repayDate.setDate(28);
  const now = new Date();
  const msLeft = repayDate - now;
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isPaid = advance.status === 'completed' && Math.abs(daysLeft) > 0 && daysLeft < 0;

  const issuedLabel  = fmtLong(advance.createdAt);
  const repayLabel   = advance.repaymentDateLabel || fmtLong(repayDate.toISOString());
  const statusLabel  = advance.status === 'completed' ? 'Completed' : 'Processing';
  const statusColor  = advance.status === 'completed' ? 'var(--secondary)' : 'var(--primary)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 300,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(520px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        background: 'var(--surface-container-lowest)',
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        zIndex: 301,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          padding: '24px 28px 20px',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>
              Repayment Breakdown
            </p>
            <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>
              {advance.reference}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Timeline */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              Timeline
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Disbursed */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--secondary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={16} color="var(--on-secondary)" strokeWidth={2.5} />
                  </div>
                  <div style={{ width: 2, height: 36, background: 'var(--outline-variant)', marginTop: 4 }} />
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Advance Disbursed</p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{issuedLabel}</p>
                </div>
              </div>

              {/* Repayment due */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: isOverdue ? 'var(--error-container)' : 'var(--surface-container-high)',
                    border: `2px solid ${isOverdue ? 'var(--error)' : 'var(--outline-variant)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Clock size={15} color={isOverdue ? 'var(--error)' : 'var(--on-surface-variant)'} />
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Repayment Due</p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{repayLabel}</p>
                  {daysLeft > 0
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--secondary)', background: 'rgba(124,249,148,0.12)', padding: '2px 10px', borderRadius: 999 }}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                      </span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', background: 'var(--surface-container)', padding: '2px 10px', borderRadius: 999 }}>
                        Deducted from salary
                      </span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Amount breakdown */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 12 }}>
              Amount Breakdown
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Principal (received)', value: `UGX ${formatUGX(advance.amountUgx)}`, bold: false },
                { label: `Bridge Fee (flat)`, value: `UGX ${formatUGX(advance.feeUgx)}`, highlight: true },
              ].map(({ label, value, highlight, bold }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: '1px solid var(--outline-variant)',
                  ...(highlight ? { color: 'var(--secondary)' } : {}),
                }}>
                  <span style={{ fontSize: 14, color: highlight ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
            {/* Total box */}
            <div style={{
              marginTop: 12,
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, opacity: 0.75 }}>Total Repayment</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--secondary-fixed)' }}>
                UGX {formatUGX(advance.totalRepaymentUgx)}
              </span>
            </div>
          </div>

          {/* Disbursement details */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 12 }}>
              Disbursement Details
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Provider',  value: `${advance.provider} Mobile Money` },
                { label: 'Recipient', value: user?.phone ?? '—' },
                { label: 'Status',    value: statusLabel, color: statusColor },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 0',
                  borderBottom: '1px solid var(--outline-variant)',
                }}>
                  <span style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--on-surface)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 28px 24px',
          borderTop: '1px solid var(--outline-variant)',
          display: 'flex', gap: 12,
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={handleDl}
            disabled={dlBusy}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', borderRadius: 999,
              background: 'var(--primary)', color: 'var(--on-primary)',
              border: 'none', fontWeight: 700, fontSize: 14, cursor: dlBusy ? 'not-allowed' : 'pointer',
              opacity: dlBusy ? 0.7 : 1,
            }}
          >
            {dlBusy
              ? <><span className="spinner-sm" /> Generating…</>
              : <><FileText size={16} /> Download Receipt</>
            }
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '13px 24px', borderRadius: 999,
              background: 'var(--surface-container)', color: 'var(--on-surface)',
              border: '1px solid var(--outline-variant)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [advances, setAdvances]       = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [showBreakdown, setBreakdown] = useState(false);
  // null | 'statement' | advance.id — tracks which PDF is being generated
  const [pdfBusy, setPdfBusy]         = useState(null);

  useEffect(() => {
    getAdvances()
      .then((res) => setAdvances(res.data))
      .catch(() => setError('Failed to load transaction history.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownloadReceipt = async (advance) => {
    if (pdfBusy) return;
    setPdfBusy(advance.id);
    try { await downloadReceipt(advance, user); }
    finally { setPdfBusy(null); }
  };

  const handleExportStatement = async () => {
    if (pdfBusy) return;
    setPdfBusy('statement');
    try { await downloadStatement(advances, user); }
    finally { setPdfBusy(null); }
  };

  const latest = advances[0];

  const activeCycle = useMemo(() => {
    if (!latest) {
      return { referenceLabel: 'Advance ID: —', onTrack: true, amountReceived: 0, fee: 0, feePct: 3, repaymentLabel: '—', totalRepayment: 0, progressPct: 0 };
    }
    const feePct = latest.amountUgx > 0 ? Math.round((latest.feeUgx / latest.amountUgx) * 100) : 3;
    return {
      referenceLabel: `Advance ID: #${latest.reference}`,
      onTrack: true,
      amountReceived: latest.amountUgx,
      fee: latest.feeUgx,
      feePct,
      repaymentLabel: latest.repaymentDateLabel,
      totalRepayment: latest.totalRepaymentUgx,
      progressPct: 0,
    };
  }, [latest]);

  const tableRows = useMemo(() => {
    const newestId = advances[0]?.id;
    return advances.map((a) => ({
      id: a.id,
      reference: `#${a.reference}`,
      sublabel: a.id === newestId ? `Repayment due: ${a.repaymentDateLabel}` : 'Standard Advance',
      dateSort: new Date(a.createdAt).getTime(),
      dateLabel: formatTableDate(a.createdAt),
      amountLabel: `UGX ${formatUGX(a.amountUgx)}`,
      amountMuted: a.id !== newestId,
      status: a.id === newestId ? 'processing' : 'paid',
    }));
  }, [advances]);

  const showingText = `Showing ${tableRows.length} transaction${tableRows.length !== 1 ? 's' : ''}`;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <header className="top-bar" style={{ paddingLeft: 'calc(var(--sidebar-width) + var(--container-margin-desktop))' }}>
        <div className="top-bar-left">
          <span className="top-bar-logo-text">GovPay Uganda</span>
          <nav className="top-bar-nav" style={{ marginLeft: '24px' }}>
            <button type="button" className="top-bar-nav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button type="button" className="top-bar-nav-item active" onClick={() => navigate('/history')}>History</button>
            <button type="button" className="top-bar-nav-item" onClick={() => navigate('/dashboard/advance')}>Salary Advance</button>
          </nav>
        </div>
        <div className="top-bar-right">
          <button type="button" className="history-icon-btn" aria-label="Notifications">
            <Bell size={22} color="var(--on-surface-variant)" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(127, 252, 151, 0.35)', padding: '6px 12px', borderRadius: '999px' }}>
            <Verified size={18} color="var(--secondary)" />
            <span className="verification-badge-text">Verified Public Servant</span>
          </div>
          <div className="history-profile-pill" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-high)' }}>
            <User size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="dashboard-content history-page">
          {/* Hero */}
          <div className="history-hero">
            <div>
              <h1 className="headline-lg" style={{ color: 'var(--on-surface)', marginBottom: '8px' }}>Transaction History</h1>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Track your salary advances and repayment progress.</p>
            </div>
            <div className="history-hero-actions">
              <div className="history-select-wrap">
                <select className="history-select" aria-label="Date range" defaultValue="30d">
                  <option value="30d">Last 30 Days</option>
                  <option value="3m">Last 3 Months</option>
                  <option value="all">All Time</option>
                </select>
                <ChevronDown size={20} className="history-select-icon" aria-hidden />
              </div>
              <button
                type="button"
                className="history-btn-export"
                onClick={handleExportStatement}
                disabled={advances.length === 0 || pdfBusy === 'statement'}
              >
                {pdfBusy === 'statement'
                  ? <><span className="spinner-sm-dark" /> Generating…</>
                  : <><Download size={20} /> Export PDF</>
                }
              </button>
            </div>
          </div>

          {/* Loading / Error */}
          {isLoading && <HistorySkeleton />}
          {error && (
            <div className="info-box" style={{ marginBottom: '24px', borderColor: 'var(--error-container)', background: 'var(--error-container)' }}>
              <p className="body-md" style={{ color: 'var(--on-error-container)', margin: 0 }}>{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Summary bento */}
              <div className="history-bento">
                <div className="history-card-cycle">
                  <div className="history-cycle-head">
                    <div>
                      <p className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px', letterSpacing: '0.08em' }}>Active Repayment Cycle</p>
                      <h2 className="headline-md" style={{ color: 'var(--primary)', marginBottom: 0 }}>{activeCycle.referenceLabel}</h2>
                    </div>
                    {activeCycle.onTrack && (
                      <div className="history-badge-on-track">
                        <span className="history-dot-pulse" />
                        On Track
                      </div>
                    )}
                  </div>

                  <div className="history-cycle-stats">
                    <div>
                      <p className="history-stat-label">Amount Received</p>
                      <p className="history-stat-value" style={{ color: 'var(--secondary)' }}>UGX {formatUGX(activeCycle.amountReceived)}</p>
                    </div>
                    <div>
                      <p className="history-stat-label">Fee Charged ({activeCycle.feePct}%)</p>
                      <p className="history-stat-value" style={{ color: 'var(--on-surface)' }}>UGX {formatUGX(activeCycle.fee)}</p>
                    </div>
                    <div>
                      <p className="history-stat-label">Expected Repayment</p>
                      <p className="history-stat-value" style={{ color: 'var(--on-surface)' }}>{activeCycle.repaymentLabel}</p>
                    </div>
                  </div>

                  <div className="history-progress-block">
                    <div className="history-progress-track">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Repayment Progress</span>
                        <span className="label-caps" style={{ color: 'var(--primary)' }}>{activeCycle.progressPct}% / {formatUGX(activeCycle.totalRepayment)} UGX</span>
                      </div>
                      <div className="history-progress-bar-wrap">
                        <div className="history-progress-bar-fill" style={{ width: `${activeCycle.progressPct}%` }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="history-link-muted"
                      onClick={() => latest && setBreakdown(true)}
                      disabled={!latest}
                    >
                      View Breakdown
                    </button>
                  </div>
                </div>

                <div className="history-card-lifetime">
                  <div className="history-lifetime-inner">
                    <p className="label-caps" style={{ opacity: 0.85, marginBottom: '24px', letterSpacing: '0.08em' }}>Lifetime Summary</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div>
                        <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '4px' }}>Total Advances</p>
                        <p className="display-balance-mobile">{advances.length}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '4px' }}>Credit Standing</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <Verified size={24} color="var(--secondary-fixed)" />
                          <span className="headline-md">EXCELLENT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Entries table */}
              <div className="history-table-shell">
                <div className="history-table-head-row">
                  <h3 className="headline-md" style={{ margin: 0 }}>Detailed Entries</h3>
                  <div className="history-table-tools">
                    <button type="button" className="history-icon-btn" aria-label="Search"><Search size={22} /></button>
                    <button type="button" className="history-icon-btn" aria-label="Filter"><SlidersHorizontal size={22} /></button>
                  </div>
                </div>

                <div className="history-table-scroll">
                  {tableRows.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                      <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>No advances yet. Request your first salary advance to get started.</p>
                    </div>
                  ) : (
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Reference ID</th>
                          <th>Date Requested</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row) => {
                          const advance = advances.find((a) => a.id === row.id);
                          return (
                            <tr key={row.id}>
                              <td>
                                <span className="history-ref-main">{row.reference}</span>
                                <div className="history-ref-sub">{row.sublabel}</div>
                              </td>
                              <td className="body-md">{row.dateLabel}</td>
                              <td className="body-md" style={{ fontWeight: 700, color: row.amountMuted ? 'var(--on-surface-variant)' : 'var(--on-surface)' }}>
                                {row.amountLabel}
                              </td>
                              <td>
                                {row.status === 'processing' && <span className="history-status-pill history-status-processing">PROCESSING</span>}
                                {row.status === 'paid' && <span className="history-status-pill history-status-paid">PAID</span>}
                                {row.status === 'pending' && <span className="history-status-pill history-status-pending">PENDING</span>}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="history-receipt-btn"
                                  onClick={() => advance && handleDownloadReceipt(advance)}
                                  disabled={!!pdfBusy}
                                >
                                  {pdfBusy === row.id
                                    ? <><span className="spinner-sm-dark" style={{ borderTopColor: 'var(--primary)' }} /> Generating…</>
                                    : <><FileText size={16} style={{ flexShrink: 0 }} /> Download Receipt</>
                                  }
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="history-pagination">
                  <p className="history-pagination-note">{showingText}</p>
                  <div className="history-page-nav">
                    <button type="button" className="history-page-btn" disabled aria-label="Previous page"><ChevronLeft size={18} /></button>
                    <button type="button" className="history-page-btn active">1</button>
                    <button type="button" className="history-page-btn" aria-label="Next page"><ChevronRight size={18} /></button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Security strip */}
          <div className="history-security">
            <div className="history-security-item">
              <div className="history-security-icon"><Shield size={24} /></div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>Encrypted Data Storage</p>
                <p className="body-md" style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>All transaction history is secured using 256-bit encryption and audited by the Ministry of Finance.</p>
              </div>
            </div>
            <div className="history-security-item">
              <div className="history-security-icon"><Verified size={24} /></div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>Transparency Pledge</p>
                <p className="body-md" style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>We provide clear fee structures with zero hidden charges. All receipts are digitally signed for authenticity.</p>
              </div>
            </div>
          </div>

          <footer className="history-footer-grid">
            <div>
              <span className="headline-md" style={{ fontWeight: 700, color: 'var(--primary)' }}>GovPay Uganda</span>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px', maxWidth: '360px' }}>Empowering Ugandan public servants with safe, fast, and transparent financial tools.</p>
              <p className="label-caps" style={{ marginTop: '24px', fontSize: '11px', color: 'var(--on-surface-variant)' }}>© {new Date().getFullYear()} Government Pay Uganda. Secured by Ministry of Finance.</p>
            </div>
            <div className="history-footer-links">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '8px' }}>Platform</p>
                <a href="#" className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Terms of Service</a>
                <a href="#" className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Privacy Policy</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '8px' }}>Connect</p>
                <a href="#" className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>Support</a>
                <a href="#" className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>FAQs</a>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="history-mobile-nav" aria-label="Mobile navigation">
        <Link to="/dashboard" className="history-mobile-nav-link"><Home size={22} /><span>Home</span></Link>
        <Link to="/dashboard/advance" className="history-mobile-nav-link"><Wallet size={22} /><span>Withdraw</span></Link>
        <Link to="/history" className="history-mobile-nav-link history-mobile-active"><Receipt size={22} strokeWidth={2.25} /><span>History</span></Link>
        <Link to="/settings" className="history-mobile-nav-link"><User size={22} /><span>Profile</span></Link>
      </nav>

      {/* Breakdown modal */}
      {showBreakdown && latest && (
        <BreakdownModal
          advance={latest}
          user={user}
          onClose={() => setBreakdown(false)}
          onDownload={(adv) => handleDownloadReceipt(adv)}
        />
      )}
    </div>
  );
}
