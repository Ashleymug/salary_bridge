import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Zap, CheckCircle2, ChevronDown, Wallet, Smartphone, Lock, Quote } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <header style={{
        background: 'var(--surface-container-lowest)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: '16px var(--container-margin-desktop)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="headline-lg" style={{ fontWeight: 700, color: 'var(--primary)' }}>GovPay Uganda</span>
        </div>
        <nav style={{ display: 'none', gap: '32px', alignItems: 'center' }} className="top-bar-nav">
          <a href="#" style={{ color: 'var(--primary)', fontWeight: 700, borderBottom: '2px solid var(--primary)' }}>Home</a>
          <a href="#" style={{ color: 'var(--on-surface-variant)' }}>How It Works</a>
          <a href="#" style={{ color: 'var(--on-surface-variant)' }}>Fees</a>
          <a href="#" style={{ color: 'var(--on-surface-variant)' }}>FAQ</a>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--secondary)" />
            <span className="label-caps" style={{ color: 'var(--secondary)', display: 'none' }}>OFFICIAL PORTAL</span>
          </div>
          <button className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: 'var(--radius-md)' }} onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section style={{
          padding: '40px var(--container-margin-desktop)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-gutter)', alignItems: 'center' }}>
            <div style={{ zIndex: 10 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--secondary-container)',
                color: 'var(--on-secondary-container)',
                padding: '4px 16px',
                borderRadius: 'var(--radius-full)',
                marginBottom: '24px'
              }}>
                <Wallet size={18} />
                <span className="label-caps">FOR UGANDAN PUBLIC SERVANTS</span>
              </div>
              <h1 style={{
                fontSize: 'clamp(28px, 5vw, 48px)',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'var(--on-surface)',
                marginBottom: '24px'
              }}>
                Access Your Earned Salary <span style={{ color: 'var(--primary)' }}>Before Payday</span>
              </h1>
              <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '32px', maxWidth: '500px' }}>
                Access the money you've already worked for without high-interest loans. A dignified bridge for the heroes of our public service.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button className="btn btn-emerald" style={{ padding: '16px 32px', fontSize: 'clamp(15px, 2vw, 18px)' }} onClick={() => navigate('/register')}>
                  Get Started
                  <ArrowRight size={20} />
                </button>
                <button className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '18px', color: 'var(--primary)', fontWeight: 700, borderColor: 'var(--primary-fixed-dim)' }}>
                  Check Eligibility
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
                <div style={{ display: 'flex' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                      width: '40px', height: '40px',
                      borderRadius: '50%',
                      border: '2px solid var(--surface)',
                      background: 'var(--surface-container)',
                      marginLeft: i > 1 ? '-12px' : 0
                    }} />
                  ))}
                </div>
                <span className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>JOINED BY 15,000+ CIVIL SERVANTS</span>
              </div>
            </div>

            {/* Right side - Glass Card */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '256px', height: '256px', background: 'rgba(11, 94, 215, 0.08)', borderRadius: '50%', filter: 'blur(48px)' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '192px', height: '192px', background: 'rgba(124, 249, 148, 0.12)', borderRadius: '50%', filter: 'blur(48px)' }} />
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                padding: '32px',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                    <p className="label-caps" style={{ color: 'var(--on-surface-variant)' }}>AVAILABLE BALANCE</p>
                    <p className="display-balance-mobile" style={{ color: 'var(--secondary)' }}>UGX 450,000</p>
                  </div>
                  <Wallet size={48} color="var(--primary)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ background: 'var(--surface-container-low)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
                    <p className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>WITHDRAWAL FEE</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p className="headline-md">Flat UGX 3,000</p>
                      <span style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>BEST VALUE</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--on-surface-variant)' }}>
                    <CheckCircle2 size={20} color="var(--secondary)" />
                    <p className="body-md">No interest. No hidden charges.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--on-surface-variant)' }}>
                    <CheckCircle2 size={20} color="var(--secondary)" />
                    <p className="body-md">Instant payout to Mobile Money.</p>
                  </div>
                  <button className="btn btn-primary btn-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/register')}>
                    <Zap size={20} /> Withdraw Instantly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '40px var(--container-margin-desktop)', background: 'var(--surface-container-low)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 className="display-balance-mobile" style={{ color: 'var(--on-surface)', marginBottom: '16px' }}>Designed for Your Financial Freedom</h2>
              <p className="body-lg" style={{ color: 'var(--on-surface-variant)', maxWidth: '600px', margin: '0 auto' }}>
                Skip the expensive payroll loans and payday lenders. SalaryBridge is built on transparency and speed.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              {[
                { icon: <Wallet size={24} />, title: 'Flat UGX 3,000 Fee', desc: 'One simple fee regardless of the amount you withdraw. No complex percentages or compounding interest.', color: 'var(--primary)' },
                { icon: <Smartphone size={24} />, title: 'Instant Mobile Money', desc: 'Receive funds directly into your MTN or Airtel account within seconds. Available 24/7, including weekends.', color: 'var(--secondary)' },
                { icon: <Lock size={24} />, title: 'Secure & Transparent', desc: 'Verified through the Ministry of Public Service. Every transaction is logged and fully transparent.', color: 'var(--tertiary)' },
              ].map((feature, i) => (
                <div key={i} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: 'var(--radius-xl)' }}>
                  <div style={{ width: '48px', height: '48px', background: `${feature.color}10`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: feature.color }}>
                    {feature.icon}
                  </div>
                  <h3 className="headline-md">{feature.title}</h3>
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section style={{ padding: '40px var(--container-margin-desktop)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
              <img style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-xl)', height: '500px'}} src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS49r2FvGjMpAXouw_Dr0E63IUgmB18dt6Ap_kH0CZFPWc1lvQ6KACmSqmW0lcluwuoTZo5tlZX8AvIHdJH3JL-bX_vy8BEQBzKFNW0wzX5YOylDjROAPB_-CRvEB107ZAOM-CZKjW_P4yA6buq512Wmtxspl8BYyUxPV0XPBSrs-OYsewB2bsPJH00h9ceJLxz-y6NFVH6K6h6Hkzy8JgBsn4Re8JtI5oPVdB-mlsFiq5zkW3_9U2-EbEm8jGbzZslUBxJ0xLRig"/>

              <div style={{ background: 'var(--surface-container-high)', borderRadius: 'var(--radius-xl)', height: '400px', display:"none" }} />
              <div>
                <h2 className="display-balance-mobile" style={{ color: 'var(--on-surface)', marginBottom: '48px' }}>How It Works</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                  {[
                    { num: '1', title: 'Register with IPPS', desc: 'Login using your official Government of Uganda Public Service credentials. We verify your status instantly.' },
                    { num: '2', title: 'Check Accrued Salary', desc: 'See exactly how much you have earned so far in the current month based on your daily work.' },
                    { num: '3', title: 'Request & Receive', desc: 'Select the amount you need and confirm. Funds hit your phone instantly. The rest of your salary arrives on payday.' },
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '24px' }}>
                      <div style={{
                        width: '48px', height: '48px',
                        background: 'var(--primary)',
                        color: 'var(--on-primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '20px',
                        flexShrink: 0
                      }}>
                        {step.num}
                      </div>
                      <div>
                        <h3 className="headline-md" style={{ marginBottom: '8px' }}>{step.title}</h3>
                        <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{
          padding: '40px var(--container-margin-desktop)',
          background: 'var(--primary-container)',
          color: 'var(--on-primary)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '384px', height: '384px', background: 'rgba(0, 110, 45, 0.15)', borderRadius: '50%', filter: 'blur(100px)' }} />
          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
              <h2 className="display-balance-mobile">Trusted by Your Colleagues</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span className="body-md">Partners:</span>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 'var(--radius-default)' }}>MTN MOMO</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 'var(--radius-default)' }}>AIRTEL MONEY</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-gutter)' }}>
              {[
                { quote: '"SalaryBridge saved me when my child needed urgent medical attention mid-month. Instead of borrowing from a moneylender with 30% interest, I just paid my flat UGX 3,000 fee and got the cash instantly. It\'s a lifesaver."', name: 'Mary Namukasa', role: 'SENIOR NURSE, MULAGO HOSPITAL' },
                { quote: '"As a teacher, sometimes my commute costs more than I have at the end of the second week. Using this platform feels professional and secure. No one knows I\'m accessing my money early; it\'s private and fast."', name: 'Robert Okello', role: 'SECONDARY SCHOOL TEACHER, GULU' },
              ].map((testimonial, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(4px)' }}>
                  <Quote size={36} color="var(--secondary-fixed)" style={{ marginBottom: '16px' }} />
                  <p className="body-lg" style={{ marginBottom: '24px' }}>{testimonial.quote}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface-container)' }} />
                    <div>
                      <p style={{ fontWeight: 700 }}>{testimonial.name}</p>
                      <p className="label-caps" style={{ fontSize: '10px', opacity: 0.7 }}>{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '40px var(--container-margin-desktop)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="display-balance-mobile" style={{ color: 'var(--on-surface)', textAlign: 'center', marginBottom: '48px' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { q: 'Is this a loan?', a: 'No. This is an advance on salary you have already earned. You are simply accessing your own money a few days early. This is why we do not charge interest.' },
                { q: 'How much can I withdraw?', a: 'You can withdraw up to 50% of your earned salary at any point in the month. This ensures you still have enough for your regular payday.' },
                { q: 'Are there any other fees?', a: 'No. There is only the flat UGX 3,000 transaction fee. No monthly maintenance, no registration fees, and definitely no interest rates.' },
              ].map((faq, i) => (
                <div key={i} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <h3 className="headline-md">{faq.q}</h3>
                    <ChevronDown size={20} />
                  </div>
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '16px' }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)',
        background: 'var(--surface-container-low)',
        borderTop: '1px solid var(--outline-variant)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-gutter)'
      }}>
        <div>
          <div className="headline-md" style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '24px' }}>GovPay Uganda</div>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: '400px' }}>
            Empowering Uganda's public service with modern financial tools. Secured and verified by the Ministry of Finance and Ministry of Public Service.
          </p>
          <p className="label-caps" style={{ color: 'var(--on-surface-variant)', marginTop: '24px' }}>
            &copy; 2024 Government Pay Uganda. Secured by Ministry of Finance.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <h4 className="label-caps" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '16px' }}>RESOURCES</h4>
            <a href="#" className="auth-footer-link" style={{ display: 'block', marginBottom: '12px' }}>Terms of Service</a>
            <a href="#" className="auth-footer-link" style={{ display: 'block', marginBottom: '12px' }}>Privacy Policy</a>
            <a href="#" className="auth-footer-link" style={{ display: 'block', marginBottom: '12px' }}>Security Standards</a>
            <a href="#" className="auth-footer-link" style={{ display: 'block' }}>Support</a>
          </div>
          <div>
            <h4 className="label-caps" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '16px' }}>CONTACT</h4>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Ministry of Finance Building,</p>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Plot 2-12 Apollo Kaggwa Rd,</p>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Kampala, Uganda</p>
          </div>
        </div>
      </footer>
    </div>
  );
}