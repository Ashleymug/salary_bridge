import { Shield } from 'lucide-react';

export default function VerificationBadge({ text = 'Verified Public Servant', size = 'default' }) {
  const isSmall = size === 'small';
  return (
    <div className="verification-badge" style={isSmall ? { padding: '2px 8px' } : {}}>
      <Shield size={isSmall ? 12 : 14} color="var(--on-secondary-container)" />
      <span className="verification-badge-text" style={isSmall ? { fontSize: '8px' } : {}}>
        {text}
      </span>
    </div>
  );
}