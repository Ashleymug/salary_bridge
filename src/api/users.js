/**
 * User / dashboard API calls.
 *
 * getDashboard()              → GET  /api/users/dashboard  → DashboardSnapshot
 * toggle2FA()                 → PUT  /api/users/2fa        → { twoFaEnabled, message }
 * changePin(currentPin, newPin) → PUT /api/users/pin       → { message }
 */
import apiClient from './client.js';

export function getDashboard() {
  return apiClient.get('/users/dashboard');
}

export function toggle2FA() {
  return apiClient.put('/users/2fa');
}

export function changePin(currentPin, newPin) {
  return apiClient.put('/users/pin', {
    current_pin: currentPin,
    new_pin: newPin,
  });
}
