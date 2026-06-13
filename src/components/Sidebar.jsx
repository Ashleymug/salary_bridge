import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, History, Settings,
  LifeBuoy, LogOut, Banknote, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/useAuth.js';

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

const VER_DOT = {
  verified:       { color: '#4ade80', label: 'Verified' },
  pending:        { color: '#fbbf24', label: 'Pending'  },
  document_error: { color: '#f87171', label: 'Action Needed' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = getInitials(user?.fullName);
  const ver      = VER_DOT[user?.verificationStatus] ?? VER_DOT.pending;

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/dashboard',         end: true,  icon: <LayoutDashboard size={18} />, label: 'Dashboard'      },
    { to: '/dashboard/advance',             icon: <Wallet          size={18} />, label: 'Salary Advance' },
    { to: '/history',                       icon: <History         size={18} />, label: 'History'        },
    { to: '/settings',                      icon: <Settings        size={18} />, label: 'Settings'       },
  ];

  return (
    <aside className="sidebar">

      {/* ── Profile ─────────────────────────────────────── */}
      <div className="sb-profile">
        <div className="sb-avatar">{initials || '?'}</div>
        <div className="sb-profile-text">
          <p className="sb-name">{user?.fullName ?? 'Public Servant'}</p>
          <p className="sb-ministry">{user?.ministry ?? 'Uganda Government'}</p>
          <div className="sb-ver-badge">
            <span className="sb-ver-dot" style={{ background: ver.color }} />
            <span className="sb-ver-label">{ver.label}</span>
          </div>
        </div>
      </div>

      {/* ── Main Nav ────────────────────────────────────── */}
      <p className="sb-section-label">Menu</p>
      <nav className="sb-nav">
        {navItems.map(({ to, end, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sb-item${isActive ? ' sb-item--active' : ''}`}
          >
            <span className="sb-item-icon">{icon}</span>
            <span className="sb-item-label">{label}</span>
            <ChevronRight size={14} className="sb-item-arrow" />
          </NavLink>
        ))}
      </nav>

      {/* ── Withdraw ────────────────────────────────────── */}
      <p className="sb-section-label" style={{ marginTop: '8px' }}>Quick Access</p>
      <div style={{ padding: '0 10px' }}>
        <button className="sb-withdraw-btn" onClick={() => navigate('/withdraw')}>
          <Banknote size={18} />
          <span>Withdraw Funds</span>
        </button>
      </div>

      {/* ── Bottom ──────────────────────────────────────── */}
      <div className="sb-bottom">
        <div className="sb-bottom-divider" />
        <NavLink
          to="/support"
          className={({ isActive }) => `sb-item sb-item--ghost${isActive ? ' sb-item--active' : ''}`}
        >
          <span className="sb-item-icon"><LifeBuoy size={18} /></span>
          <span className="sb-item-label">Support</span>
        </NavLink>
        <button type="button" className="sb-item sb-item--ghost sb-logout" onClick={handleLogout}>
          <span className="sb-item-icon"><LogOut size={18} /></span>
          <span className="sb-item-label">Logout</span>
        </button>
      </div>

    </aside>
  );
}
