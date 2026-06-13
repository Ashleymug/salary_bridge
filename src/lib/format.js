/** @param {number} amount */
export function formatUGX(amount) {
  return Math.round(amount).toLocaleString('en-UG');
}

/** @param {string} raw */
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('256')) return digits.slice(-9).padStart(9, '0');
  return digits.slice(-9).padStart(9, '0');
}

/** @param {string} raw */
export function maskPhone(raw) {
  const n = normalizePhone(raw);
  if (n.length < 9) return '••• ••• •••';
  const last3 = n.slice(-3);
  return `256 ${n.slice(0, 3)} ••• ${last3}`;
}

/** @param {string} fullName */
export function initialsFromName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
