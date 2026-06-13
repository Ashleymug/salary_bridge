/**
 * Salary-advance API calls.
 *
 * createAdvance(payload) → POST /api/advances/    → AdvanceResponse
 * getAdvances()          → GET  /api/advances/    → AdvanceResponse[]
 * getAdvance(id)         → GET  /api/advances/:id → AdvanceResponse
 */
import apiClient from './client.js';

/**
 * @param {{ amountUgx: number, provider: 'MTN' | 'Airtel' }} payload
 */
export function createAdvance(payload) {
  return apiClient.post('/advances/', {
    amount_ugx: payload.amountUgx,
    provider: payload.provider,
  });
}

export function getAdvances() {
  return apiClient.get('/advances/');
}

export function getAdvance(id) {
  return apiClient.get(`/advances/${id}`);
}
