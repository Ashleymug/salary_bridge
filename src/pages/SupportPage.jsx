import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Bell, ArrowRight, LifeBuoy, ChevronDown, ChevronUp,
  Phone, Mail, MessageSquare, Clock, AlertCircle, BookOpen,
  Smartphone, CreditCard, ShieldCheck, UserCheck, HelpCircle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import VerificationBadge from '../components/VerificationBadge';
import { useAuth } from '../context/useAuth.js';

/* ── FAQ data ─────────────────────────────────────────────── */
const FAQ_SECTIONS = [
  {
    category: 'Getting Started',
    icon: <BookOpen size={18} />,
    color: 'var(--primary)',
    items: [
      {
        q: 'What is GovPay Uganda?',
        a: 'GovPay Uganda is an Earned Wage Access (EWA) platform for Ugandan public servants. It lets you access a portion of the salary you have already earned before your official pay date — with zero interest. You are not taking a loan; you are simply accessing money that is already yours.',
      },
      {
        q: 'Who is eligible to use GovPay Uganda?',
        a: 'All verified public servants employed by the Government of Uganda across ministries, departments, and agencies (MDAs) are eligible. Your IPPS number must be active and your employment status must be confirmed by the Ministry of Public Service.',
      },
      {
        q: 'How do I register?',
        a: 'Click "Get Started" on the homepage and provide your Employee ID (IPPS number), National ID, ministry, district of service, and mobile money details. Your account is reviewed and verified against the IPPS payroll database before it becomes active.',
      },
      {
        q: 'Is there a cost to register or use the service?',
        a: 'Registration is completely free. A small service fee (displayed before you confirm any advance) is deducted from the disbursed amount. There are no hidden charges, penalties, or interest.',
      },
    ],
  },
  {
    category: 'Salary Advances',
    icon: <CreditCard size={18} />,
    color: 'var(--secondary)',
    items: [
      {
        q: 'How much can I access?',
        a: 'You can access up to 50% of your net monthly salary for the current pay period. The available amount increases proportionally as more days of the month pass — the more days you have worked, the more you can access.',
      },
      {
        q: 'How quickly will the funds reach me?',
        a: 'Approved advances are disbursed directly to your registered MTN Mobile Money or Airtel Money wallet within minutes. Most transactions complete in under 5 minutes.',
      },
      {
        q: 'How is the advance repaid?',
        a: 'Your advance is automatically recovered from your salary at the end of the month by the Government payroll system. You do not need to make any manual repayment. The deduction appears on your payslip as "EWA Recovery".',
      },
      {
        q: 'Can I take multiple advances in the same month?',
        a: 'You can take up to two advances per calendar month, provided your total accessed amount does not exceed 50% of your net salary for that month. Once that limit is reached, advances are locked until the next pay cycle.',
      },
      {
        q: 'My advance was rejected. What should I do?',
        a: 'Common reasons for rejection include: outstanding advances not yet recovered, salary not yet confirmed by payroll, account not fully verified, or the requested amount exceeds your available limit. Check your History page for the rejection reason, or contact our support team for assistance.',
      },
    ],
  },
  {
    category: 'Mobile Money & Payments',
    icon: <Smartphone size={18} />,
    color: '#6d4400',
    items: [
      {
        q: 'Which mobile money providers are supported?',
        a: 'GovPay Uganda currently supports MTN Mobile Money and Airtel Money. Your linked number must be active and registered in your name to receive disbursements.',
      },
      {
        q: 'Can I change my linked mobile money number?',
        a: 'To change your linked mobile money number, please contact our support team or visit your HR office. For security reasons, number changes require identity verification and are processed within 2 working days.',
      },
      {
        q: 'I did not receive funds after approval. What should I do?',
        a: 'First confirm the transaction is shown as "Completed" in your History page. If it shows completed but funds have not arrived, check your mobile money wallet directly. If the issue persists after 30 minutes, contact us with your Transaction Reference number so we can investigate.',
      },
    ],
  },
  {
    category: 'Account & Security',
    icon: <ShieldCheck size={18} />,
    color: 'var(--error)',
    items: [
      {
        q: 'I forgot my security PIN. How do I reset it?',
        a: 'At the moment, PIN resets must be requested through your HR office or by contacting our support team. You will need to verify your identity using your National ID and Employee ID. Self-service PIN reset via your registered phone number is coming soon.',
      },
      {
        q: 'What is Two-Factor Authentication (2FA) and should I enable it?',
        a: 'When 2FA is enabled, logging in requires both your PIN and a verification step using your registered phone number. We strongly recommend enabling 2FA to protect your account from unauthorised access. You can toggle it in Settings → Security.',
      },
      {
        q: 'I think my account has been accessed without my permission. What should I do?',
        a: 'Change your security PIN immediately via Settings → Security → Change PIN. Then contact our support team on 0800 100 999 so we can review your account activity, freeze disbursements if needed, and file an incident report.',
      },
    ],
  },
  {
    category: 'Verification',
    icon: <UserCheck size={18} />,
    color: 'var(--secondary)',
    items: [
      {
        q: 'My account is showing "Pending Verification". How long does this take?',
        a: 'Verification typically takes 1–3 working days. Our system checks your IPPS number against the Ministry of Public Service database. If verification takes longer, it may be due to a mismatch in your submitted details — contact support with your Employee ID for a manual review.',
      },
      {
        q: 'What does "Document Error" status mean?',
        a: 'This means one or more documents you submitted (National ID, appointment letter) could not be validated. Please contact our support team or visit your HR office to re-submit the required documents. Your account will remain restricted until verification is complete.',
      },
    ],
  },
];

/* ── Contact channels ─────────────────────────────────────── */
const CONTACT_CHANNELS = [
  {
    icon: <Phone size={22} />,
    color: 'var(--secondary)',
    title: 'Toll-Free Helpline',
    detail: '0800 100 999',
    sub: 'Monday – Friday, 8:00 AM – 6:00 PM',
    action: 'tel:0800100999',
    actionLabel: 'Call Now',
  },
  {
    icon: <Mail size={22} />,
    color: 'var(--primary)',
    title: 'Email Support',
    detail: 'support@govpay.go.ug',
    sub: 'Response within 1 working day',
    action: 'mailto:support@govpay.go.ug',
    actionLabel: 'Send Email',
  },
  {
    icon: <MessageSquare size={22} />,
    color: '#6d4400',
    title: 'WhatsApp Support',
    detail: '+256 700 999 000',
    sub: 'Chat with an agent (business hours)',
    action: null,
    actionLabel: 'Open WhatsApp',
  },
];

/* ── Quick action cards ───────────────────────────────────── */
const QUICK_LINKS = [
  { label: 'Request an Advance', desc: 'Access your earned wages now', path: '/dashboard/advance', color: 'var(--primary)' },
  { label: 'View Transaction History', desc: 'All past advances and statuses', path: '/history', color: 'var(--secondary)' },
  { label: 'Account Settings', desc: 'Security, PIN, 2FA', path: '/settings', color: 'var(--error)' },
];

/* ── Accordion item ───────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid var(--outline-variant)',
      paddingBottom: open ? '16px' : '14px',
      transition: 'padding-bottom 0.2s',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '12px', background: 'none',
          border: 'none', cursor: 'pointer', padding: '14px 0 0',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.5 }}>{q}</span>
        <span style={{ flexShrink: 0, color: 'var(--on-surface-variant)', marginTop: '2px' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <p style={{
          marginTop: '10px', fontSize: '14px', color: 'var(--on-surface-variant)',
          lineHeight: 1.7,
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(null);

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
              <h2 className="headline-lg" style={{ marginBottom: '4px' }}>Help &amp; Support</h2>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Answers, guides, and ways to reach our team.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)' }}>

            {/* ── Hero info box ─────────────────────────────── */}
            <div className="card" style={{
              padding: 'var(--space-gutter)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
              color: 'var(--on-primary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <LifeBuoy size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                    We're here to help, {user?.fullName?.split(' ')[0] ?? 'there'}.
                  </h3>
                  <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: 1.6, maxWidth: '560px' }}>
                    GovPay Uganda is operated by the Ministry of Finance, Planning and Economic Development
                    in partnership with the Ministry of Public Service. Our team is available Monday to Friday,
                    8:00 AM – 6:00 PM EAT.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Quick links ───────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              {QUICK_LINKS.map(({ label, desc, path, color }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className="card"
                  style={{
                    padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
                    border: 'none', background: 'var(--surface-container-lowest)',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>{desc}</span>
                </button>
              ))}
            </div>

            {/* ── Contact channels ──────────────────────────── */}
            <div className="card" style={{ padding: 'var(--space-gutter)' }}>
              <h3 className="headline-md" style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={20} color="var(--primary)" />
                Contact Us
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {CONTACT_CHANNELS.map(({ icon, color, title, detail, sub, action, actionLabel }) => (
                  <div key={title} style={{
                    padding: '18px', borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-container-low)',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-container-highest)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color,
                    }}>
                      {icon}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{title}</p>
                      <p style={{ fontSize: '15px', fontWeight: 600, color, marginBottom: '3px' }}>{detail}</p>
                      <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {sub}
                      </p>
                    </div>
                    {action ? (
                      <a
                        href={action}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', textAlign: 'center', display: 'block' }}
                      >
                        {actionLabel}
                      </a>
                    ) : (
                      <button type="button" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }} disabled>
                        Coming Soon
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Office / escalation ───────────────────────── */}
            <div className="card" style={{ padding: 'var(--space-gutter)' }}>
              <h3 className="headline-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} color="var(--tertiary)" />
                Escalation &amp; Physical Office
              </h3>
              <div className="info-box" style={{ marginBottom: '16px' }}>
                <AlertCircle size={20} color="var(--tertiary)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                  For unresolved issues, identity disputes, or payroll discrepancies, please visit your
                  <strong> Ministry HR office</strong> or contact the <strong>Ministry of Public Service</strong> directly
                  at Parliament Avenue, Kampala. Bring your National ID and latest payslip.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)' }}>
                  <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>Ministry of Public Service</p>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>Parliamentary Buildings Annex, Kampala</p>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>+256 414 250 888</p>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)' }}>
                  <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>Ministry of Finance (MFPED)</p>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>Yusuf Lule Road, Kampala</p>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>+256 414 707 000</p>
                </div>
              </div>
            </div>

            {/* ── FAQ ───────────────────────────────────────── */}
            <div className="card" style={{ padding: 'var(--space-gutter)' }}>
              <h3 className="headline-md" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="var(--primary)" />
                Frequently Asked Questions
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
                Click a category to browse questions, or expand any item for the full answer.
              </p>

              {/* Category tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 600,
                    border: '1.5px solid',
                    borderColor: activeSection === null ? 'var(--primary)' : 'var(--outline-variant)',
                    background:  activeSection === null ? 'var(--primary)' : 'transparent',
                    color:       activeSection === null ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  All
                </button>
                {FAQ_SECTIONS.map(({ category, color }) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveSection(s => s === category ? null : category)}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 600,
                      border: '1.5px solid',
                      borderColor: activeSection === category ? color : 'var(--outline-variant)',
                      background:  activeSection === category ? color : 'transparent',
                      color:       activeSection === category ? '#fff' : 'var(--on-surface-variant)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* FAQ sections */}
              {FAQ_SECTIONS
                .filter(s => !activeSection || s.category === activeSection)
                .map(({ category, icon, color, items }) => (
                  <div key={category} style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color }}>{icon}</span>
                      <p style={{ fontWeight: 700, fontSize: '14px', color }}>{category}</p>
                    </div>
                    {items.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
                  </div>
                ))
              }
            </div>

            {/* ── Data & privacy note ───────────────────────── */}
            <div style={{
              padding: '14px 18px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface-container)', fontSize: '13px',
              color: 'var(--on-surface-variant)', lineHeight: 1.7,
            }}>
              <strong>Data & Privacy:</strong> GovPay Uganda processes your personal data in accordance with
              the Uganda Data Protection and Privacy Act, 2019. Your salary and employment information is
              fetched securely from the IPPS payroll system and is never shared with third parties.
              For privacy concerns, email <a href="mailto:privacy@govpay.go.ug" style={{ color: 'var(--primary)' }}>privacy@govpay.go.ug</a>.
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
