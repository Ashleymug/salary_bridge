import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, Users, User, Wallet, History,
  LogOut, Bell, Search, CheckCircle2, XCircle, Eye, EyeOff,
  Upload, AlertCircle, Edit2, Save, X,
  RefreshCw, DollarSign, Calendar, Briefcase,
  ChevronDown, ChevronUp, ChevronRight, Activity, UserPlus,
  Settings, Lock, Shield, ShieldOff, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/useAuth.js';
import { getOverview, verifyUser, updateSalary, createEmployee, changeAdminPassword, toggleAdmin2FA } from '../api/admin.js';
import { AdminDashboardSkeleton } from '../components/Skeleton.jsx';
import { formatUGX, initialsFromName, maskPhone } from '../lib/format';
import '../styles/admin-dashboard.css';

// ── helpers ──────────────────────────────────────────────────

function fmtCompact(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(Math.round(v));
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
           ' · ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return iso; }
}

// Daily wage accumulation (matches backend formula exactly)
function computeDailyStats(monthlySalary) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysWorked  = Math.min(now.getDate(), daysInMonth);
  const fraction    = daysWorked / daysInMonth;
  const earnedToDate = Math.floor(monthlySalary * fraction);
  const eligibleCap  = Math.min(900_000, Math.floor(monthlySalary * 0.5));
  const dailyRate    = Math.floor(monthlySalary / daysInMonth);
  return { daysWorked, daysInMonth, earnedToDate, eligibleCap, dailyRate };
}

function statusMeta(s) {
  if (s === 'verified')       return { label: 'VERIFIED',        cls: 'verified' };
  if (s === 'document_error') return { label: 'DOC ERROR',       cls: 'error'    };
  return                             { label: 'PENDING REVIEW',  cls: 'pending'  };
}

// ── tiny shared UI ────────────────────────────────────────────

function Avatar({ name, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--primary-container)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initialsFromName(name)}
    </div>
  );
}

function SeverityDot({ s }) {
  const color = s === 'success' ? 'var(--secondary)' : s === 'warning' ? 'var(--error)' : 'var(--primary)';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--on-surface-variant)' }}>
      <div style={{ marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{text}</p>
    </div>
  );
}

// ── Salary Edit Row (inline) ──────────────────────────────────

function SalaryEditCell({ servant, onSave }) {
  const [editing, setEditing]   = useState(false);
  const [value,   setValue]     = useState('');
  const [saving,  setSaving]    = useState(false);
  const [err,     setErr]       = useState('');

  const open = () => { setValue(String(servant.monthlySalaryUgx ?? '')); setErr(''); setEditing(true); };
  const cancel = () => setEditing(false);

  const save = async () => {
    const n = parseInt(value.replace(/,/g, ''), 10);
    if (isNaN(n) || n < 0) { setErr('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await onSave(servant.id, n);
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 700 }}>UGX {formatUGX(servant.monthlySalaryUgx)}</span>
        <button type="button" className="admin-icon-btn" style={{ padding: 4 }} onClick={open} title="Edit salary">
          <Edit2 size={14} color="var(--primary)" />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          type="text"
          className="input-field"
          style={{ padding: '4px 8px', fontSize: 13, width: 130 }}
          value={value}
          onChange={e => { setValue(e.target.value); setErr(''); }}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          autoFocus
        />
        <button type="button" className="admin-icon-btn" style={{ padding: 4 }} onClick={save} disabled={saving} title="Save">
          {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} color="var(--secondary)" />}
        </button>
        <button type="button" className="admin-icon-btn" style={{ padding: 4 }} onClick={cancel} title="Cancel">
          <X size={14} color="var(--error)" />
        </button>
      </div>
      {err && <p style={{ fontSize: 11, color: 'var(--error)', margin: 0 }}>{err}</p>}
    </div>
  );
}

// ── User Detail Drawer ────────────────────────────────────────

function UserDrawer({ servant, onClose, onVerify, onSalarySave, verifyingId }) {
  if (!servant) return null;
  const { earnedToDate, eligibleCap, dailyRate, daysWorked, daysInMonth } = computeDailyStats(servant.monthlySalaryUgx);
  const available = Math.max(0, eligibleCap - (servant.exposureThisMonth ?? 0));
  const sm = statusMeta(servant.verificationStatus);

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
        onClick={onClose}
      />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 100vw)',
        background: 'var(--surface-container-lowest)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar name={servant.fullName} size={48} />
            <div>
              <p style={{ fontWeight: 800, fontSize: 16 }}>{servant.fullName}</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{servant.employeeId}</p>
              <span className={`admin-badge ${sm.cls}`} style={{ marginTop: 4 }}>{sm.label}</span>
            </div>
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Payroll snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              { label: 'Monthly Salary',   val: `UGX ${formatUGX(servant.monthlySalaryUgx)}`, color: 'var(--primary)'   },
              { label: 'Daily Rate',        val: `UGX ${formatUGX(dailyRate)}/day`,              color: 'var(--secondary)' },
              { label: `Earned (${daysWorked}/${daysInMonth} days)`, val: `UGX ${formatUGX(earnedToDate)}`, color: 'var(--secondary)' },
              { label: 'Available Now',    val: `UGX ${formatUGX(available)}`,               color: available > 0 ? 'var(--secondary)' : 'var(--error)' },
              { label: 'Advanced (month)', val: `UGX ${formatUGX(servant.exposureThisMonth ?? 0)}`, color: 'var(--on-surface)' },
              { label: 'Total Advances',   val: servant.advanceCount ?? 0,                   color: 'var(--on-surface)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ padding: '12px 14px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</p>
                <p style={{ fontWeight: 800, fontSize: 14, color }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Salary edit */}
          <div>
            <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Edit Monthly Salary</p>
            <SalaryEditCell servant={servant} onSave={onSalarySave} />
          </div>

          {/* Profile */}
          <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 16 }}>
            <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Profile</p>
            {[
              ['Ministry',     servant.ministry    ],
              ['Job Category', servant.jobCategory ],
              ['District',     servant.district    ],
              ['Phone',        servant.phone       ],
              ['Provider',     servant.provider    ],
              ['Email',        servant.email || '—'],
              ['Registered',   fmtDate(servant.createdAt)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--outline-variant)', fontSize: 13 }}>
                <span style={{ color: 'var(--on-surface-variant)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Verification actions */}
          <div>
            <p style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Verification</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {servant.verificationStatus !== 'verified' && (
                <button type="button" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', gap: 6 }}
                  disabled={verifyingId === servant.id} onClick={() => onVerify(servant.id, 'verified')}>
                  <CheckCircle2 size={15} /> Approve
                </button>
              )}
              {servant.verificationStatus !== 'document_error' && (
                <button type="button" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', gap: 6, borderColor: 'var(--error)', color: 'var(--error)' }}
                  disabled={verifyingId === servant.id} onClick={() => onVerify(servant.id, 'document_error')}>
                  <XCircle size={15} /> Flag Error
                </button>
              )}
              {servant.verificationStatus !== 'pending' && (
                <button type="button" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', gap: 6 }}
                  disabled={verifyingId === servant.id} onClick={() => onVerify(servant.id, 'pending')}>
                  <RefreshCw size={15} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Add Employee Drawer ───────────────────────────────────────

const EMPTY_FORM = {
  fullName: '', employeeId: '', ministry: '', jobCategory: '',
  district: '', monthlySalaryUgx: '', phone: '', provider: 'MTN',
  pin: '', confirmPin: '', verificationStatus: 'pending', email: '',
};

function AddEmployeeDrawer({ onClose, onCreated }) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.pin !== form.confirmPin) { setErr('PINs do not match.'); return; }
    if (!/^\d{4,6}$/.test(form.pin))  { setErr('PIN must be 4–6 digits only.'); return; }
    const salary = parseInt(form.monthlySalaryUgx.replace(/,/g, ''), 10);
    if (isNaN(salary) || salary < 0)  { setErr('Enter a valid monthly salary.'); return; }

    setSaving(true);
    try {
      const res = await createEmployee({ ...form, monthlySalaryUgx: salary });
      onCreated(res.data);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setErr(Array.isArray(detail) ? detail[0]?.msg : (detail || 'Failed to create employee.'));
    } finally {
      setSaving(false);
    }
  };

  function LabelledField({ label, required, children }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}{required && <span style={{ color: 'var(--error)' }}> *</span>}
        </label>
        {children}
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} onClick={onClose} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(460px, 100vw)',
        background: 'var(--surface-container-lowest)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', flexShrink: 0, position: 'sticky', top: 0, background: 'var(--surface-container-lowest)', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-lg)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserPlus size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16 }}>Add Employee</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Register a new public servant</p>
            </div>
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <LabelledField label="Full Name" required>
              <input className="input-field" value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Akinyi Grace" />
            </LabelledField>
            <LabelledField label="Employee ID" required>
              <input className="input-field" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required placeholder="MPS-2024-0042" />
            </LabelledField>
          </div>

          <LabelledField label="Ministry" required>
            <input className="input-field" value={form.ministry} onChange={e => set('ministry', e.target.value)} required placeholder="Ministry of Health" />
          </LabelledField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <LabelledField label="Job Category" required>
              <input className="input-field" value={form.jobCategory} onChange={e => set('jobCategory', e.target.value)} required placeholder="Health Worker" />
            </LabelledField>
            <LabelledField label="District" required>
              <input className="input-field" value={form.district} onChange={e => set('district', e.target.value)} required placeholder="Kampala" />
            </LabelledField>
          </div>

          <LabelledField label="Monthly Salary (UGX)" required>
            <input className="input-field" type="text" inputMode="numeric" value={form.monthlySalaryUgx} onChange={e => set('monthlySalaryUgx', e.target.value)} required placeholder="800000" />
          </LabelledField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <LabelledField label="Phone" required>
              <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="0700 000 000" />
            </LabelledField>
            <LabelledField label="Provider" required>
              <select className="input-field" value={form.provider} onChange={e => set('provider', e.target.value)}>
                <option value="MTN">MTN Mobile Money</option>
                <option value="Airtel">Airtel Money</option>
              </select>
            </LabelledField>
          </div>

          <LabelledField label="Email (optional)">
            <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="grace@ministry.go.ug" />
          </LabelledField>

          <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--on-surface-variant)' }}>Login Credentials</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <LabelledField label="Initial PIN (4–6 digits)" required>
                <input className="input-field" type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={e => set('pin', e.target.value)} required placeholder="••••" />
              </LabelledField>
              <LabelledField label="Confirm PIN" required>
                <input className="input-field" type="password" inputMode="numeric" maxLength={6} value={form.confirmPin} onChange={e => set('confirmPin', e.target.value)} required placeholder="••••" />
              </LabelledField>
            </div>
          </div>

          <LabelledField label="Verification Status">
            <select className="input-field" value={form.verificationStatus} onChange={e => set('verificationStatus', e.target.value)}>
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="document_error">Document Error</option>
            </select>
          </LabelledField>

          {err && (
            <div style={{ background: 'var(--error-container)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
              <p style={{ color: 'var(--error)', fontSize: 13 }}>{err}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 8, paddingBottom: 8 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={saving}>
              {saving
                ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                : <UserPlus size={15} />}
              {saving ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: DASHBOARD
// ══════════════════════════════════════════════════════════════

function TabDashboard({ overview }) {
  const chart        = overview.monthlyAdvances ?? [];
  const peak         = Math.max(...chart.map(m => m.amountUgx), 1);
  const sixMoTotal   = chart.reduce((s, m) => s + m.amountUgx, 0);
  const verifiedPct  = overview.totalServants > 0
    ? Math.round(
        (overview.servants ?? []).filter(s => s.verificationStatus === 'verified').length
        / overview.totalServants * 100
      )
    : 0;
  const noData = sixMoTotal === 0;

  const KPI_ITEMS = [
    {
      label: 'Total Advanced',
      value: `UGX ${fmtCompact(overview.totalAdvancedUgx)}`,
      sub:   `${overview.repaymentRate.toFixed(1)}% repayment rate`,
      icon:  <Wallet size={20} />,
      accent: '#4ade80',
    },
    {
      label: 'Public Servants',
      value: overview.totalServants.toLocaleString(),
      sub:   `${verifiedPct}% verified`,
      icon:  <Users size={20} />,
      accent: '#93c5fd',
    },
    {
      label: 'Pending Reviews',
      value: overview.pendingVerification,
      sub:   overview.pendingVerification > 0 ? 'require action' : 'all clear',
      icon:  <AlertCircle size={20} />,
      accent: overview.pendingVerification > 0 ? '#fca5a5' : '#86efac',
    },
    {
      label: 'Avg Monthly Salary',
      value: `UGX ${fmtCompact(overview.avgSalaryUgx)}`,
      sub:   'across all servants',
      icon:  <DollarSign size={20} />,
      accent: '#c4b5fd',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero banner ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #001840 0%, #003785 55%, #0047A9 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(20px, 3vw, 28px) clamp(16px, 3vw, 36px)',
        color: '#fff',
        display: 'flex',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        gap: '0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,24,64,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 160, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {KPI_ITEMS.map(({ label, value, sub, icon, accent }, idx) => (
          <div key={label} style={{ display: 'flex', alignItems: 'stretch', flex: '1 1 180px', minWidth: 0 }}>
            {/* Divider — before every item except the first */}
            {idx > 0 && (
              <div className="admin-kpi-divider" style={{ width: 1, background: 'rgba(255,255,255,0.12)', flexShrink: 0, margin: '0 28px' }} />
            )}
            <div style={{ flex: 1, position: 'relative', zIndex: 1, padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: accent, flexShrink: 0,
                }}>
                  {icon}
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.65 }}>{label}</p>
              </div>
              <p style={{ fontSize: 30, fontWeight: 800, color: accent, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 5 }}>{value}</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Disbursements chart ──────────────────────────── */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px 24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Chart header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Monthly Disbursements</h3>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>EWA advances paid out — last 6 months</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--on-surface-variant)', marginBottom: 3 }}>6-Month Total</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>UGX {fmtCompact(sixMoTotal)}</p>
            </div>
            <span style={{ background: 'var(--secondary-container)', color: 'var(--secondary)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 'var(--radius-full)' }}>
              Live
            </span>
          </div>
        </div>

        {noData ? (
          <EmptyState icon={<Activity size={40} />} text="No disbursements recorded yet." />
        ) : (
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            {/* Y-axis labels */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 52, flexShrink: 0, paddingBottom: 28 }}>
              {[peak, Math.round(peak * 0.75), Math.round(peak * 0.5), Math.round(peak * 0.25), 0].map((v, i) => (
                <span key={i} style={{ fontSize: 10, color: 'var(--on-surface-variant)', textAlign: 'right', paddingRight: 10, lineHeight: 1, opacity: 0.55, fontWeight: 600 }}>
                  {v > 0 ? fmtCompact(v) : '0'}
                </span>
              ))}
            </div>

            {/* Chart canvas */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Bar area with grid lines */}
              <div style={{ position: 'relative', height: 220 }}>
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map(pct => (
                  <div key={pct} style={{
                    position: 'absolute', left: 0, right: 0, bottom: `${pct}%`,
                    borderTop: `1px ${pct === 0 ? 'solid' : 'dashed'} var(--outline-variant)`,
                    opacity: pct === 0 ? 0.8 : 0.4,
                  }} />
                ))}
                {/* Bars */}
                <div style={{ display: 'flex', gap: 12, height: '100%', alignItems: 'flex-end', position: 'relative', zIndex: 1, paddingBottom: 0 }}>
                  {chart.map((m) => {
                    const pct    = Math.max(3, Math.round((m.amountUgx / peak) * 100));
                    const isPeak = m.amountUgx === peak && m.amountUgx > 0;
                    const hasData = m.amountUgx > 0;
                    return (
                      <div key={m.label} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {/* Value above bar */}
                        <p style={{
                          fontSize: 10, fontWeight: 800, marginBottom: 5,
                          color: isPeak ? 'var(--primary)' : 'var(--on-surface-variant)',
                          visibility: hasData ? 'visible' : 'hidden',
                          whiteSpace: 'nowrap',
                        }}>
                          {fmtCompact(m.amountUgx)}
                        </p>
                        {/* Bar */}
                        <div style={{
                          width: '100%',
                          height: `${pct}%`,
                          minHeight: hasData ? 6 : 2,
                          borderRadius: '8px 8px 0 0',
                          background: isPeak
                            ? 'linear-gradient(180deg, #0047A9 0%, rgba(0,71,169,0.55) 100%)'
                            : hasData
                              ? 'linear-gradient(180deg, rgba(0,71,169,0.32) 0%, rgba(0,71,169,0.08) 100%)'
                              : 'var(--outline-variant)',
                          boxShadow: isPeak ? '0 -4px 16px rgba(0,71,169,0.25)' : 'none',
                        }} />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Month labels row — separate from bar area */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {chart.map((m) => {
                  const isPeak = m.amountUgx === peak && m.amountUgx > 0;
                  return (
                    <div key={m.label} style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{
                        fontSize: 11,
                        fontWeight: isPeak ? 800 : 600,
                        color: isPeak ? 'var(--primary)' : 'var(--on-surface-variant)',
                        letterSpacing: '0.06em',
                      }}>
                        {m.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Audit feed ──────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800 }}>Recent Audit Events</h3>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 3 }}>Latest activity across all accounts</p>
          </div>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
            {(overview.auditLogs ?? []).length} events
          </span>
        </div>
        <div style={{ padding: '20px 28px' }}>
          {(overview.auditLogs ?? []).slice(0, 8).map((log, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <div key={log.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                {/* Timeline spine */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 10 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--primary)',
                    flexShrink: 0, marginTop: 3,
                  }} />
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, background: 'var(--outline-variant)', minHeight: 28, marginTop: 4 }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{log.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: 6 }}>{log.detail}</p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', opacity: 0.55 }}>{fmtTime(log.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
        {(overview.auditLogs ?? []).length === 0 && (
          <EmptyState icon={<History size={36} />} text="No audit events recorded yet." />
        )}
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: VERIFICATIONS
// ══════════════════════════════════════════════════════════════

function TabVerifications({ servants, onVerify, verifyingId, onViewUser, search }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return (servants ?? []).filter(s => {
      const matchSearch = !search || s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        s.ministry.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || s.verificationStatus === filter;
      return matchSearch && matchFilter;
    });
  }, [servants, search, filter]);

  const counts = useMemo(() => ({
    all:            (servants ?? []).length,
    pending:        (servants ?? []).filter(s => s.verificationStatus === 'pending').length,
    verified:       (servants ?? []).filter(s => s.verificationStatus === 'verified').length,
    document_error: (servants ?? []).filter(s => s.verificationStatus === 'document_error').length,
  }), [servants]);

  return (
    <div className="admin-table-wrap">
      <div className="admin-table-head">
        <div>
          <h3 className="headline-md">Verification Queue</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
            Review and approve employee identity for salary advance eligibility.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'all',            label: `All (${counts.all})`          },
            { key: 'pending',        label: `Pending (${counts.pending})`  },
            { key: 'verified',       label: `Verified (${counts.verified})` },
            { key: 'document_error', label: `Errors (${counts.document_error})` },
          ].map(({ key, label }) => (
            <button key={key} type="button"
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: '1.5px solid', transition: 'all 0.15s',
                borderColor: filter === key ? 'var(--primary)' : 'var(--outline-variant)',
                background:  filter === key ? 'var(--primary)' : 'transparent',
                color:       filter === key ? '#fff'           : 'var(--on-surface-variant)',
              }}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Public Servant</th>
              <th>Employee ID</th>
              <th>Ministry</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6}><EmptyState icon={<ShieldCheck size={40} />} text="No servants match the current filter." /></td></tr>
            )}
            {filtered.map((s) => {
              const sm = statusMeta(s.verificationStatus);
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={s.fullName} size={32} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>{s.fullName}</p>
                        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{s.employeeId}</td>
                  <td style={{ fontSize: 13 }}>{s.ministry}</td>
                  <td style={{ fontSize: 13 }}>{fmtDate(s.createdAt)}</td>
                  <td><span className={`admin-badge ${sm.cls}`}>{sm.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {s.verificationStatus === 'pending' && (
                        <>
                          <button type="button" className="admin-icon-btn" title="Approve"
                            disabled={verifyingId === s.id} onClick={() => onVerify(s.id, 'verified')}>
                            <CheckCircle2 size={18} color="var(--secondary)" />
                          </button>
                          <button type="button" className="admin-icon-btn" title="Flag document error"
                            disabled={verifyingId === s.id} onClick={() => onVerify(s.id, 'document_error')}>
                            <XCircle size={18} color="var(--error)" />
                          </button>
                        </>
                      )}
                      {s.verificationStatus === 'document_error' && (
                        <button type="button" className="admin-icon-btn" title="Request re-upload"
                          disabled={verifyingId === s.id} onClick={() => onVerify(s.id, 'pending')}>
                          <Upload size={18} color="var(--tertiary)" />
                        </button>
                      )}
                      {s.verificationStatus === 'verified' && (
                        <button type="button" className="admin-icon-btn" title="Reset to pending"
                          disabled={verifyingId === s.id} onClick={() => onVerify(s.id, 'pending')}>
                          <RefreshCw size={18} color="var(--on-surface-variant)" />
                        </button>
                      )}
                      <button type="button" className="admin-icon-btn" title="View details" onClick={() => onViewUser(s)}>
                        <Eye size={18} color="var(--primary)" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '14px 24px', background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
          Showing {filtered.length} of {counts.all} servants · {counts.pending} pending review
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: PAYROLL MANAGEMENT (KEY feature — salary editing)
// ══════════════════════════════════════════════════════════════

function TabPayroll({ servants, onSalarySave, onViewUser, onAddEmployee, search }) {
  const [sortField, setSortField] = useState('fullName');
  const [sortAsc,   setSortAsc]   = useState(true);

  const toggleSort = (field) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(true); }
  };

  const now          = new Date();
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysWorked   = Math.min(now.getDate(), daysInMonth);

  const rows = useMemo(() => {
    const base = (servants ?? []).filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.fullName.toLowerCase().includes(q) ||
             s.employeeId.toLowerCase().includes(q) ||
             s.ministry.toLowerCase().includes(q);
    });

    return [...base].sort((a, b) => {
      let va, vb;
      if (sortField === 'monthlySalaryUgx') { va = a.monthlySalaryUgx; vb = b.monthlySalaryUgx; }
      else if (sortField === 'earned')       { va = a.monthlySalaryUgx * daysWorked / daysInMonth; vb = b.monthlySalaryUgx * daysWorked / daysInMonth; }
      else                                   { va = (a[sortField] || '').toLowerCase(); vb = (b[sortField] || '').toLowerCase(); }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [servants, search, sortField, sortAsc, daysWorked, daysInMonth]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  // Payroll totals
  const totalPayroll    = useMemo(() => rows.reduce((s, r) => s + r.monthlySalaryUgx, 0), [rows]);
  const totalEarnedToday = useMemo(() => rows.reduce((s, r) => s + Math.floor(r.monthlySalaryUgx * daysWorked / daysInMonth), 0), [rows, daysWorked, daysInMonth]);
  const totalExposure   = useMemo(() => rows.reduce((s, r) => s + (r.exposureThisMonth ?? 0), 0), [rows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)' }}>
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { icon: <Briefcase size={18} />, label: 'Total Monthly Payroll',    val: `UGX ${fmtCompact(totalPayroll)}`,     color: 'var(--primary)'   },
          { icon: <Calendar  size={18} />, label: `Earned (${daysWorked}/${daysInMonth} days)`, val: `UGX ${fmtCompact(totalEarnedToday)}`, color: 'var(--secondary)' },
          { icon: <Activity  size={18} />, label: 'Advanced This Month',      val: `UGX ${fmtCompact(totalExposure)}`,    color: 'var(--tertiary)'  },
        ].map(({ icon, label, val, color }) => (
          <div key={label} className="admin-stat-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color }}>
              {icon}
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head">
          <div>
            <h3 className="headline-md">Payroll Management</h3>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
              Set each servant's monthly salary. Daily earned wages update automatically.
              Daily rate = salary ÷ {daysInMonth} days this month.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13, flexShrink: 0 }}
            onClick={onAddEmployee}
          >
            <UserPlus size={16} /> Add Employee
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('fullName')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Servant <SortIcon field="fullName" /></div>
                </th>
                <th>ID / Ministry</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('monthlySalaryUgx')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Monthly Salary <SortIcon field="monthlySalaryUgx" /></div>
                </th>
                <th>Daily Rate</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('earned')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Earned Today <SortIcon field="earned" /></div>
                </th>
                <th>Available Now</th>
                <th>Advances (mo.)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9}><EmptyState icon={<Users size={40} />} text="No servants found." /></td></tr>
              )}
              {rows.map((s) => {
                const { earnedToDate, eligibleCap, dailyRate } = computeDailyStats(s.monthlySalaryUgx);
                const available = Math.max(0, eligibleCap - (s.exposureThisMonth ?? 0));
                const sm = statusMeta(s.verificationStatus);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={s.fullName} size={32} />
                        <p style={{ fontWeight: 700, fontSize: 14 }}>{s.fullName}</p>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{s.employeeId}</p>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{s.ministry}</p>
                    </td>
                    <td><SalaryEditCell servant={s} onSave={onSalarySave} /></td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>UGX {formatUGX(dailyRate)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: 13 }}>UGX {formatUGX(earnedToDate)}</td>
                    <td style={{ fontWeight: 700, color: available > 0 ? 'var(--secondary)' : 'var(--error)', fontSize: 13 }}>
                      UGX {formatUGX(available)}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 700 }}>UGX {fmtCompact(s.exposureThisMonth ?? 0)}</span>
                      <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'block' }}>{s.advanceCount ?? 0} total</span>
                    </td>
                    <td><span className={`admin-badge ${sm.cls}`}>{sm.label}</span></td>
                    <td>
                      <button type="button" className="admin-icon-btn" title="View full profile" onClick={() => onViewUser(s)}>
                        <Eye size={18} color="var(--primary)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 24px', background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)' }}>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
            {rows.length} servant{rows.length !== 1 ? 's' : ''} · Click <Edit2 size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> on a salary to edit inline · Press Enter to save
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: DISBURSEMENTS
// ══════════════════════════════════════════════════════════════

function TabDisbursements({ advances, servants, search }) {
  const servantMap = useMemo(() => {
    const m = {};
    (servants ?? []).forEach(s => { m[s.id] = s; });
    return m;
  }, [servants]);

  const filtered = useMemo(() => {
    if (!search) return advances ?? [];
    const q = search.toLowerCase();
    return (advances ?? []).filter(a => {
      const s = servantMap[a.userId];
      return a.reference?.toLowerCase().includes(q) ||
             s?.fullName?.toLowerCase().includes(q) ||
             s?.employeeId?.toLowerCase().includes(q);
    });
  }, [advances, servantMap, search]);

  const totalAmt  = useMemo(() => filtered.filter(a => a.status === 'completed').reduce((s, a) => s + a.amountUgx, 0), [filtered]);
  const totalFees = useMemo(() => filtered.filter(a => a.status === 'completed').reduce((s, a) => s + a.feeUgx, 0), [filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Advances Shown',    val: filtered.length                         },
          { label: 'Total Disbursed',   val: `UGX ${fmtCompact(totalAmt)}`           },
          { label: 'Total Fees Earned', val: `UGX ${fmtCompact(totalFees)}`          },
        ].map(({ label, val }) => (
          <div key={label} className="admin-stat-card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6, letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 800 }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head">
          <h3 className="headline-md">All Disbursements</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Servant</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Total Repay</th>
                <th>Provider</th>
                <th>Repayment Date</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9}><EmptyState icon={<Wallet size={40} />} text="No advances found." /></td></tr>
              )}
              {filtered.map((a) => {
                const s = servantMap[a.userId];
                return (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700 }}>{a.reference}</td>
                    <td>
                      {s ? (
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 13 }}>{s.fullName}</p>
                          <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{s.employeeId}</p>
                        </div>
                      ) : <span style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ fontWeight: 700 }}>UGX {formatUGX(a.amountUgx)}</td>
                    <td style={{ fontSize: 13 }}>UGX {formatUGX(a.feeUgx)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>UGX {formatUGX(a.totalRepaymentUgx)}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700,
                        background: a.provider === 'MTN' ? 'var(--mtn-yellow)' : 'var(--airtel-red)',
                        color: a.provider === 'MTN' ? '#1a1200' : '#fff',
                      }}>{a.provider}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.repaymentDateLabel}</td>
                    <td style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{fmtDate(a.createdAt)}</td>
                    <td>
                      <span className={`admin-badge ${a.status === 'completed' ? 'verified' : a.status === 'failed' ? 'error' : 'pending'}`}>
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 24px', background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)' }}>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: AUDIT LOGS
// ══════════════════════════════════════════════════════════════

function TabAudit({ auditLogs, search }) {
  const [sev, setSev] = useState('all');

  const filtered = useMemo(() => {
    return (auditLogs ?? []).filter(l => {
      const matchSev    = sev === 'all' || l.severity === sev;
      const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
                          l.detail.toLowerCase().includes(search.toLowerCase());
      return matchSev && matchSearch;
    });
  }, [auditLogs, sev, search]);

  return (
    <div className="admin-table-wrap">
      <div className="admin-table-head">
        <div>
          <h3 className="headline-md">Audit Logs</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Full system event history — all admin actions and user activity.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all','All'], ['success','Success'], ['info','Info'], ['warning','Warning']].map(([key, label]) => (
            <button key={key} type="button"
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: '1.5px solid', transition: 'all 0.15s',
                borderColor: sev === key ? 'var(--primary)' : 'var(--outline-variant)',
                background:  sev === key ? 'var(--primary)' : 'transparent',
                color:       sev === key ? '#fff'           : 'var(--on-surface-variant)',
              }}
              onClick={() => setSev(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filtered.length === 0 && <EmptyState icon={<Activity size={40} />} text="No events match the current filter." />}
        {filtered.map((log, i) => (
          <div key={log.id} style={{
            display: 'flex', gap: 16, padding: '14px 24px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--outline-variant)' : 'none',
            borderLeft: `3px solid ${log.severity === 'success' ? 'var(--secondary)' : log.severity === 'warning' ? 'var(--error)' : 'var(--primary)'}`,
          }}>
            <div style={{ minWidth: 120 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>
                {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{log.title}</p>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-full)',
                  background: log.severity === 'success' ? 'var(--secondary-container)' : log.severity === 'warning' ? 'var(--error-container)' : 'var(--surface-container-high)',
                  color: log.severity === 'success' ? 'var(--secondary)' : log.severity === 'warning' ? 'var(--error)' : 'var(--primary)',
                  textTransform: 'uppercase',
                }}>
                  {log.severity}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{log.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 24px', background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)' }}>
        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: SETTINGS
// ══════════════════════════════════════════════════════════════

const STRENGTH_LABELS = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/;

function strengthScore(pw) {
  let s = 0;
  if (pw.length >= 8)       s++;
  if (/[A-Z]/.test(pw))    s++;
  if (/[a-z]/.test(pw))    s++;
  if (/\d/.test(pw))        s++;
  if (SPECIAL_RE.test(pw))  s++;
  return s;
}

function TabSettings({ user, onLogout, onRefreshUser }) {
  const [form, setForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]   = useState({ current: false, new: false, confirm: false });
  const [busy, setBusy]   = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  const [twoFaBusy,    setTwoFaBusy]    = useState(false);
  const [twoFaToast,   setTwoFaToast]   = useState(null);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const score = strengthScore(form.newPassword);
  const criteria = [
    { label: '8+ characters',     met: form.newPassword.length >= 8 },
    { label: 'Uppercase',         met: /[A-Z]/.test(form.newPassword) },
    { label: 'Lowercase',         met: /[a-z]/.test(form.newPassword) },
    { label: 'Number',            met: /\d/.test(form.newPassword) },
    { label: 'Special character', met: SPECIAL_RE.test(form.newPassword) },
  ];
  const passwordsMatch = form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;
  const canSubmit = form.currentPassword.length > 0 && score === 5 && passwordsMatch && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setToast(null);
    try {
      await changeAdminPassword(form);
      setToast({ type: 'success', msg: 'Password changed. You will be logged out in 3 seconds…' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => onLogout(), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to change password. Please try again.';
      setToast({ type: 'error', msg: detail });
      setBusy(false);
    }
  }

  async function handleToggle2FA(confirmed = false) {
    if (user?.twoFaEnabled && !confirmed) {
      setConfirmDisable(true);
      setTwoFaToast(null);
      return;
    }
    setConfirmDisable(false);
    setTwoFaBusy(true);
    setTwoFaToast(null);
    try {
      const { data } = await toggleAdmin2FA();
      await onRefreshUser();
      setTwoFaToast({ type: 'success', msg: data.message });
      setTimeout(() => setTwoFaToast(null), 5000);
    } catch (err) {
      setTwoFaToast({ type: 'error', msg: err.response?.data?.detail || 'Failed to update 2FA setting.' });
    } finally {
      setTwoFaBusy(false);
    }
  }

  function PasswordField({ id, label, fieldKey, showKey, placeholder, autoComplete }) {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={id}>{label}</label>
        <div className="input-with-icon">
          <span className="input-icon"><Lock size={15} /></span>
          <input
            id={id}
            className="input-field"
            type={show[showKey] ? 'text' : 'password'}
            placeholder={placeholder}
            value={form[fieldKey]}
            onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
            required
            autoComplete={autoComplete}
          />
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
            tabIndex={-1}
            aria-label={show[showKey] ? 'Hide password' : 'Show password'}
          >
            {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 className="headline-md">Account Settings</h3>
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Manage your admin account security and preferences.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: 2FA + Account Info ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--outline-variant)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid var(--outline-variant)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ShieldCheck size={18} color="var(--secondary)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Two-Factor Authentication</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                Require phone verification after password on every login.
              </p>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700,
              background: user?.twoFaEnabled ? 'var(--secondary-container)' : 'var(--surface-container-high)',
              color:      user?.twoFaEnabled ? 'var(--secondary)'           : 'var(--on-surface-variant)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              {user?.twoFaEnabled ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
              {user?.twoFaEnabled
                ? 'Phone verification is required after your password on each login. Your account has elevated protection.'
                : 'Enable to require phone number verification after your password on each login.'}
            </p>

            {twoFaToast && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                background: twoFaToast.type === 'success' ? 'var(--secondary-container)' : 'var(--error-container)',
                color:      twoFaToast.type === 'success' ? 'var(--secondary)'           : 'var(--error)',
              }}>
                {twoFaToast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {twoFaToast.msg}
              </div>
            )}

            {confirmDisable ? (
              <div style={{
                padding: '16px 18px', borderRadius: 'var(--radius-lg)',
                background: 'var(--error-container)', border: '1px solid rgba(186,26,26,0.2)',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                  <AlertTriangle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Disable two-factor authentication?</p>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      Your account will only be protected by your password. This reduces your account security.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      padding: '8px 18px', fontSize: 13,
                      background: 'var(--error)', borderColor: 'var(--error)',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}
                    onClick={() => handleToggle2FA(true)}
                    disabled={twoFaBusy}
                  >
                    {twoFaBusy
                      ? <><span className="spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Disabling…</>
                      : 'Yes, disable 2FA'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '8px 18px', fontSize: 13 }}
                    onClick={() => setConfirmDisable(false)}
                    disabled={twoFaBusy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={`btn ${user?.twoFaEnabled ? 'btn-outline' : 'btn-primary'}`}
                style={{ alignSelf: 'flex-start', padding: '9px 22px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                onClick={() => handleToggle2FA(false)}
                disabled={twoFaBusy}
              >
                {twoFaBusy ? (
                  <>
                    <span className={user?.twoFaEnabled ? 'spinner-sm-dark' : 'spinner-sm'}
                      style={!user?.twoFaEnabled ? { borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' } : {}} />
                    {user?.twoFaEnabled ? 'Disabling…' : 'Enabling…'}
                  </>
                ) : (
                  user?.twoFaEnabled ? <><ShieldOff size={15} /> Disable 2FA</> : <><ShieldCheck size={15} /> Enable 2FA</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div style={{
          background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--outline-variant)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid var(--outline-variant)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <User size={18} color="var(--primary)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Account Information</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                Your registered admin profile details.
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px',
              }}>
                {initialsFromName(user?.fullName)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{user?.fullName ?? '—'}</p>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3,
                  padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700,
                  background: 'var(--primary-container)', color: 'var(--primary)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {user?.role ?? 'admin'}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              {[
                { label: 'Employee ID',  value: user?.employeeId  ?? '—' },
                { label: 'Email',        value: user?.email       ?? '—' },
                { label: 'Ministry',     value: user?.ministry    ?? '—' },
                { label: 'Job Category', value: user?.jobCategory ?? '—' },
                { label: 'District',     value: user?.district    ?? '—' },
                { label: 'Phone',        value: user?.phone ? maskPhone(user.phone) : '—' },
                { label: 'Member Since', value: user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—' },
                { label: 'Verification', value: user?.verificationStatus?.replace('_', ' ') ?? '—',
                  color: user?.verificationStatus === 'verified' ? 'var(--secondary)'
                       : user?.verificationStatus === 'document_error' ? 'var(--error)'
                       : 'var(--on-surface-variant)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 2 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: color ?? 'var(--on-surface)', wordBreak: 'break-word' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        </div>{/* end left column wrapper */}

        {/* ── RIGHT: Change Password ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--outline-variant)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--outline-variant)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Lock size={18} color="var(--primary)" />
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>Change Password</p>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  Requires your current password. All active sessions will be terminated on success.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {toast && (
                <div style={{
                  padding: '11px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: toast.type === 'success' ? 'var(--secondary-container)' : 'var(--error-container)',
                  color: toast.type === 'success' ? 'var(--secondary)' : 'var(--error)',
                }}>
                  {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {toast.msg}
                </div>
              )}

              <PasswordField
                id="cp-current"
                label="Current Password"
                fieldKey="currentPassword"
                showKey="current"
                placeholder="Enter your current password"
                autoComplete="current-password"
              />

              <div className="form-group">
                <label className="form-label" htmlFor="cp-new">New Password</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Lock size={15} /></span>
                  <input
                    id="cp-new"
                    className="input-field"
                    type={show.new ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={form.newPassword}
                    onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                    tabIndex={-1}
                    aria-label={show.new ? 'Hide password' : 'Show password'}
                  >
                    {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {form.newPassword.length > 0 && (
                  <>
                    <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 4, borderRadius: 2, transition: 'background 0.2s',
                          background: i <= score ? STRENGTH_COLORS[score] : 'var(--outline-variant)',
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, marginTop: 3, color: STRENGTH_COLORS[score] }}>
                      {STRENGTH_LABELS[score]}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 5 }}>
                      {criteria.map(({ label, met }) => (
                        <span key={label} style={{
                          fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
                          color: met ? 'var(--secondary)' : 'var(--on-surface-variant)',
                        }}>
                          <CheckCircle2 size={11} style={{ opacity: met ? 1 : 0.3 }} />
                          {label}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cp-confirm">Confirm New Password</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Lock size={15} /></span>
                  <input
                    id="cp-confirm"
                    className="input-field"
                    type={show.confirm ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    tabIndex={-1}
                    aria-label={show.confirm ? 'Hide password' : 'Show password'}
                  >
                    {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirmPassword.length > 0 && (
                  <p style={{
                    fontSize: 11, marginTop: 4, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: passwordsMatch ? 'var(--secondary)' : 'var(--error)',
                  }}>
                    {passwordsMatch
                      ? <><CheckCircle2 size={12} /> Passwords match</>
                      : <><AlertCircle  size={12} /> Passwords do not match</>}
                  </p>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={!canSubmit} style={{ marginTop: 4 }}>
                {busy
                  ? <><span className="spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Changing…</>
                  : <><Lock size={15} /> Change Password</>}
              </button>
            </form>
          </div>

          <div style={{
            padding: '11px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)',
            fontSize: 12, color: 'var(--on-surface-variant)', display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} color="var(--primary)" />
            <span>
              Password changes are logged in the audit trail. After a successful change you will be
              logged out and must sign in again with your new password.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════

const NAV = [
  { key: 'dashboard',     icon: <LayoutDashboard size={20} />, label: 'Dashboard'     },
  { key: 'verifications', icon: <ShieldCheck     size={20} />, label: 'Verifications' },
  { key: 'payroll',       icon: <DollarSign      size={20} />, label: 'Payroll'       },
  { key: 'disbursements', icon: <Wallet          size={20} />, label: 'Disbursements' },
  { key: 'audit',         icon: <History         size={20} />, label: 'Audit Logs'    },
  { key: 'settings',      icon: <Settings        size={20} />, label: 'Settings'      },
];

export default function AdminDashboardPage() {
  const navigate      = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [tab,          setTab]          = useState('dashboard');
  const [overview,     setOverview]     = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');
  const [verifyingId,   setVerifyingId]   = useState(null);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [search,        setSearch]        = useState('');

  const loadOverview = useCallback(() => {
    setIsLoading(true);
    getOverview()
      .then(r => setOverview(r.data))
      .catch(() => setError('Failed to load admin data. Please refresh.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const handleVerify = async (userId, newStatus) => {
    setVerifyingId(userId);
    try {
      await verifyUser(userId, newStatus);
      // Update local state immediately
      setOverview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          servants: prev.servants.map(s =>
            s.id === userId ? { ...s, verificationStatus: newStatus } : s
          ),
          pendingVerification: prev.servants.filter(s =>
            (s.id === userId ? newStatus : s.verificationStatus) === 'pending'
          ).length,
        };
      });
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, verificationStatus: newStatus } : prev);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Verification update failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSalarySave = async (userId, salaryUgx) => {
    await updateSalary(userId, salaryUgx);
    // Update local state immediately so table reflects new salary without full reload
    setOverview(prev => {
      if (!prev) return prev;
      const servants = prev.servants.map(s =>
        s.id === userId ? { ...s, monthlySalaryUgx: salaryUgx } : s
      );
      const salaries = servants.filter(s => s.monthlySalaryUgx > 0).map(s => s.monthlySalaryUgx);
      return {
        ...prev,
        servants,
        avgSalaryUgx: salaries.length ? Math.floor(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
      };
    });
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, monthlySalaryUgx: salaryUgx } : prev);
    }
  };

  const handleCreateEmployee = (newUser) => {
    setOverview(prev => {
      if (!prev) return prev;
      const servant = { ...newUser, exposureThisMonth: 0, advanceCount: 0 };
      const servants = [servant, ...prev.servants];
      const salaries = servants.filter(s => s.monthlySalaryUgx > 0).map(s => s.monthlySalaryUgx);
      return {
        ...prev,
        servants,
        totalServants: prev.totalServants + 1,
        avgSalaryUgx: salaries.length ? Math.floor(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
        pendingVerification: newUser.verificationStatus === 'pending'
          ? prev.pendingVerification + 1
          : prev.pendingVerification,
      };
    });
    setShowAddDrawer(false);
  };

  // ── pending badge count ──────────────────────────────────────
  const pendingCount = overview?.pendingVerification ?? 0;

  if (isLoading) return <AdminDashboardSkeleton />;

  if (error) {
    return (
      <div className="admin-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="info-box" style={{ maxWidth: 400 }}>
          <p style={{ color: 'var(--error)' }}>{error}</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={loadOverview}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="admin-shell">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="admin-aside">

          {/* Brand */}
          <div style={{ padding: '22px 20px 0', flexShrink: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 17, color: '#ffffff', lineHeight: 1.2 }}>GovPay Uganda</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Admin Portal</p>
          </div>

          {/* Profile card */}
          <div className="sb-profile">
            <div className="sb-avatar">{initialsFromName(user?.fullName)}</div>
            <div className="sb-profile-text">
              <p className="sb-name">{user?.fullName ?? 'Administrator'}</p>
              <p className="sb-ministry">Ministry of Public Service</p>
              <div className="sb-ver-badge">
                <span className="sb-ver-dot" style={{ background: '#4ade80' }} />
                <span className="sb-ver-label">Admin Access</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <p className="sb-section-label">Navigation</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px', flex: 1 }} aria-label="Primary">
            {NAV.map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                className={`sb-item${tab === key ? ' sb-item--active' : ''}`}
                onClick={() => setTab(key)}
              >
                <span className="sb-item-icon">{icon}</span>
                <span className="sb-item-label">{label}</span>
                {key === 'verifications' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 'var(--radius-full)',
                    background: 'var(--error)', color: '#fff',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                  }}>
                    {pendingCount}
                  </span>
                )}
                <ChevronRight size={13} className="sb-item-arrow" />
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div className="sb-bottom">
            <div className="sb-bottom-divider" />
            <button type="button" className="sb-item sb-item--ghost sb-logout" onClick={handleLogout}>
              <span className="sb-item-icon"><LogOut size={18} /></span>
              <span className="sb-item-label">Logout</span>
            </button>
          </div>

        </aside>

        {/* ── Main ────────────────────────────────────────── */}
        <main className="admin-main">
          {/* Topbar */}
          <header className="admin-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 className="headline-md" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                {NAV.find(n => n.key === tab)?.label ?? 'Dashboard'}
              </h2>
            </div>
            <div className="admin-search">
              <Search size={18} color="var(--outline)" />
              <input
                type="search"
                placeholder="Search name, ID, ministry…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search"
              />
            </div>
            <div className="admin-topbar-actions">
              <button type="button" className="admin-icon-btn" title="Refresh data" onClick={loadOverview}>
                <RefreshCw size={20} />
              </button>
              <button type="button" className="admin-icon-btn" aria-label="Notifications">
                <Bell size={20} />
                {pendingCount > 0 && <span className="admin-notify-dot" />}
              </button>
            </div>
          </header>

          {/* Tab content */}
          <div className="admin-bento">
            {overview && tab === 'dashboard'     && <TabDashboard     overview={overview} />}
            {overview && tab === 'verifications' && <TabVerifications servants={overview.servants} onVerify={handleVerify} verifyingId={verifyingId} onViewUser={setSelectedUser} search={search} />}
            {overview && tab === 'payroll'       && <TabPayroll       servants={overview.servants} onSalarySave={handleSalarySave} onViewUser={setSelectedUser} onAddEmployee={() => setShowAddDrawer(true)} search={search} />}
            {overview && tab === 'disbursements' && <TabDisbursements advances={overview.advances} servants={overview.servants} search={search} />}
            {overview && tab === 'audit'         && <TabAudit         auditLogs={overview.auditLogs} search={search} />}
            {tab === 'settings'                  && <TabSettings      user={user} onLogout={handleLogout} onRefreshUser={refreshUser} />}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="admin-mobile-nav" aria-label="Mobile">
        {NAV.slice(0, 4).map(({ key, icon, label }) => (
          <button key={key} type="button" className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {icon}{label.split(' ')[0].toUpperCase()}
          </button>
        ))}
      </nav>

      {/* User detail drawer */}
      {selectedUser && (
        <UserDrawer
          servant={selectedUser}
          onClose={() => setSelectedUser(null)}
          onVerify={handleVerify}
          onSalarySave={handleSalarySave}
          verifyingId={verifyingId}
        />
      )}

      {/* Add employee drawer */}
      {showAddDrawer && (
        <AddEmployeeDrawer
          onClose={() => setShowAddDrawer(false)}
          onCreated={handleCreateEmployee}
        />
      )}
    </div>
  );
}
