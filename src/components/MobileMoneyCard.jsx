import { CheckCircle2 } from 'lucide-react';

export default function MobileMoneyCard({ provider, selected, maskedNumber, onSelect }) {
  const isMTN = provider === 'MTN';

  return (
    <div
      className={`mobile-money-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(provider)}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(provider); }}
    >
      <div className={`mobile-money-logo ${isMTN ? 'mtn' : 'airtel'}`}>
        {isMTN ? 'MTN' : 'AIRTEL'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="mobile-money-name">{isMTN ? 'MTN MoMo' : 'Airtel Money'}</p>
        <p className="mobile-money-number">{maskedNumber}</p>
      </div>
      <div className="mobile-money-check">
        {selected
          ? <CheckCircle2 size={20} color="var(--secondary)" strokeWidth={2.5} />
          : <div className="radio-indicator" />
        }
      </div>
    </div>
  );
}
