import Sidebar from './Sidebar';

/* ─────────────────────────────────────────────────────
   Primitives
───────────────────────────────────────────────────── */

export function Sk({ w = '100%', h = 16, r = 8, dark = false, style = {} }) {
  return (
    <span
      className={dark ? 'sk-dark' : 'sk'}
      style={{ display: 'block', width: w, height: h, borderRadius: r, flexShrink: 0, ...style }}
    />
  );
}

function SkRow({ children, gap = 12, style = {} }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap, ...style }}>{children}</div>;
}

/* ─────────────────────────────────────────────────────
   Admin Dashboard Skeleton
───────────────────────────────────────────────────── */

export function AdminDashboardSkeleton() {
  return (
    <div className="admin-root">
      <div className="admin-shell">
        {/* Sidebar placeholder */}
        <aside className="admin-aside" style={{ padding: '24px 16px' }}>
          <Sk w="60%" h={28} r={6} style={{ marginBottom: 32 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Sk key={i} w="85%" h={14} r={6} style={{ marginBottom: 16 }} />
          ))}
        </aside>

        <div className="admin-main">
          {/* Top bar */}
          <div className="admin-topbar">
            <Sk w={180} h={18} r={6} />
            <SkRow>
              <Sk w={32} h={32} r="50%" />
              <Sk w={32} h={32} r="50%" />
            </SkRow>
          </div>

          <div className="admin-bento">
            {/* Hero KPI banner */}
            <div style={{
              background: 'var(--primary)',
              borderRadius: 16,
              padding: 'clamp(20px, 3vw, 32px)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
            }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Sk dark w="55%" h={11} r={5} />
                  <Sk dark w="70%" h={30} r={6} />
                  <Sk dark w="40%" h={11} r={5} />
                </div>
              ))}
            </div>

            {/* Two-column row: chart + audit feed */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Chart card */}
              <div style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 16, padding: 24,
              }}>
                <Sk w="50%" h={14} r={6} style={{ marginBottom: 20 }} />
                {/* Y-axis + bars */}
                <div style={{ display: 'flex', gap: 16, height: 160 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 4 }}>
                    {[1, 2, 3, 4].map((i) => <Sk key={i} w={28} h={10} r={4} />)}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    {[45, 70, 55, 85, 60, 90].map((pct, i) => (
                      <Sk key={i} w="100%" h={`${pct}%`} r={4} />
                    ))}
                  </div>
                </div>
                {/* Month labels */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10, paddingLeft: 44 }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => <Sk key={i} w={28} h={10} r={4} />)}
                </div>
              </div>

              {/* Audit feed card */}
              <div style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 16, padding: 24,
              }}>
                <Sk w="45%" h={14} r={6} style={{ marginBottom: 20 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <SkRow key={i} gap={14} style={{ alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <Sk w={10} h={10} r="50%" />
                        {i < 4 && <Sk w={2} h={40} r={1} style={{ marginTop: 4 }} />}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Sk w="60%" h={12} r={5} />
                        <Sk w="90%" h={10} r={4} />
                        <Sk w="35%" h={10} r={4} />
                      </div>
                    </SkRow>
                  ))}
                </div>
              </div>
            </div>

            {/* Table card */}
            <div style={{
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline-variant)' }}>
                <SkRow>
                  <Sk w={120} h={14} r={6} />
                  <Sk w={80} h={14} r={6} style={{ marginLeft: 'auto' }} />
                </SkRow>
              </div>
              {/* Table rows */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Sk w={32} h={32} r="50%" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Sk w="40%" h={12} r={5} />
                    <Sk w="25%" h={10} r={4} />
                  </div>
                  <Sk w={60} h={10} r={4} />
                  <Sk w={80} h={12} r={5} />
                  <Sk w={50} h={22} r={999} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Dashboard Skeleton
───────────────────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Welcome header */}
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Sk w={220} h={22} r={6} />
              <Sk w={300} h={14} r={5} />
            </div>
            <Sk w={180} h={48} r={12} />
          </div>

          <div className="dashboard-grid">
            {/* Hero card skeleton */}
            <div className="dashboard-hero-card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Sk w={160} h={12} r={5} />
                  <Sk w={260} h={52} r={8} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <Sk w={80} h={12} r={5} />
                  <Sk w={100} h={32} r={6} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Sk w="60%" h={10} r={4} />
                    <Sk w="75%" h={20} r={5} />
                    <Sk w="100%" h={6} r={3} />
                  </div>
                ))}
              </div>
              <Sk w={180} h={48} r={999} />
            </div>

            {/* Repayment card skeleton */}
            <div className="dashboard-repayment-card" style={{ padding: 24 }}>
              <Sk w={140} h={12} r={5} style={{ marginBottom: 24 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, flex: 1 }}>
                <Sk w={160} h={160} r="50%" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
                  <Sk w="60%" h={12} r={5} />
                  <Sk w="45%" h={22} r={6} />
                </div>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Sk w="35%" h={12} r={4} />
                    <Sk w="30%" h={12} r={4} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Advance Page Skeleton
───────────────────────────────────────────────────── */

export function AdvanceSkeleton() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Page title */}
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Sk w={220} h={22} r={6} />
            <Sk w={320} h={14} r={5} />
          </div>

          <div className="advance-grid">
            {/* Left: form card */}
            <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Sk w="45%" h={12} r={5} />
                <Sk w="70%" h={48} r={8} />
              </div>
              {/* Slider track */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Sk w={60} h={11} r={4} />
                  <Sk w={60} h={11} r={4} />
                </div>
                <Sk w="100%" h={8} r={999} />
              </div>
              {/* Money grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ background: 'var(--surface-container-low)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Sk w="60%" h={10} r={4} />
                    <Sk w="80%" h={18} r={5} />
                  </div>
                ))}
              </div>
              {/* Provider selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Sk w="30%" h={12} r={5} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <Sk w={120} h={48} r={10} />
                  <Sk w={120} h={48} r={10} />
                </div>
              </div>
              <Sk w="100%" h={52} r={999} />
            </div>

            {/* Right: summary card */}
            <div className="summary-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Sk w="50%" h={14} r={6} />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--outline-variant)' }}>
                  <Sk w="40%" h={12} r={4} />
                  <Sk w="30%" h={12} r={4} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   History Page Skeleton
───────────────────────────────────────────────────── */

export function HistorySkeleton() {
  return (
    <>
      {/* Hero */}
      <div className="history-hero" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Sk w={240} h={28} r={7} />
          <Sk w={300} h={14} r={5} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Sk w={120} h={40} r={8} />
          <Sk w={130} h={40} r={8} />
        </div>
      </div>

      {/* Bento */}
      <div className="history-bento">
        {/* Active cycle card */}
        <div className="history-card-cycle" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Sk w={140} h={12} r={5} />
            <Sk w={80} h={22} r={999} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Sk w={80} h={80} r="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Sk w="55%" h={12} r={4} />
              <Sk w="70%" h={20} r={5} />
              <Sk w="100%" h={6} r={3} />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Sk w="35%" h={11} r={4} />
              <Sk w="28%" h={11} r={4} />
            </div>
          ))}
        </div>

        {/* Lifetime stats card */}
        <div style={{
          background: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <Sk w={130} h={12} r={5} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Sk w="40%" h={11} r={4} />
                <Sk w="25%" h={11} r={4} />
              </div>
              <Sk w="100%" h={6} r={3} />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 16, overflow: 'hidden', marginTop: 16,
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline-variant)' }}>
          <Sk w={120} h={12} r={5} />
        </div>
        <div className="history-table-scroll" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
                {['160px', '100px', '110px', '100px', '80px'].map((w, i) => (
                  <th key={i} style={{ padding: '12px 24px', textAlign: 'left' }}>
                    <Sk w={w} h={10} r={4} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((row) => (
                <tr key={row} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Sk w={120} h={12} r={5} />
                      <Sk w={160} h={10} r={4} />
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}><Sk w={80} h={12} r={4} /></td>
                  <td style={{ padding: '16px 24px' }}><Sk w={90} h={12} r={4} /></td>
                  <td style={{ padding: '16px 24px' }}><Sk w={75} h={12} r={4} /></td>
                  <td style={{ padding: '16px 24px' }}><Sk w={60} h={22} r={999} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   Withdraw Page Skeleton
───────────────────────────────────────────────────── */

export function WithdrawSkeleton() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content" style={{ maxWidth: 600 }}>
          {/* Page title */}
          <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Sk w={200} h={22} r={6} />
            <Sk w={280} h={14} r={5} />
          </div>

          {/* Step bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Sk w={32} h={32} r="50%" />
                  <Sk w={64} h={10} r={4} />
                </div>
                {i < 3 && <Sk w="100%" h={2} r={1} style={{ marginTop: -16, flex: 1, minWidth: 24 }} />}
              </div>
            ))}
          </div>

          {/* Balance overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {[1, 2].map((i) => (
              <div key={i} style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 12, padding: 20,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <Sk w="55%" h={11} r={4} />
                <Sk w="70%" h={24} r={6} />
              </div>
            ))}
          </div>

          {/* Amount selector card */}
          <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Sk w="40%" h={16} r={6} />
              <Sk w={80} h={38} r={8} />
            </div>
            {/* Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Sk w={55} h={10} r={4} />
                <Sk w={55} h={10} r={4} />
              </div>
              <Sk w="100%" h={8} r={999} />
            </div>
            {/* Summary rows */}
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--outline-variant)' }}>
                <Sk w="35%" h={12} r={4} />
                <Sk w="25%" h={12} r={4} />
              </div>
            ))}
            <Sk w="100%" h={52} r={999} />
          </div>
        </div>
      </main>
    </div>
  );
}
