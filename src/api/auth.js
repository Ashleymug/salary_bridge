/**
 * Authentication API calls.
 *
 * register(payload)           → POST /api/auth/register      → { accessToken, tokenType, user }
 * login(credentials)          → POST /api/auth/login         → LoginResponse (may include requiresTwoFa)
 * verifyPhone(token, phone)   → POST /api/auth/verify-phone  → { accessToken, tokenType, user }
 * getMe()                     → GET  /api/auth/me            → user object
 */
import apiClient from './client.js';

export function register(payload) {
  return apiClient.post('/auth/register', {
    employee_id: payload.employeeId,
    full_name: payload.fullName,
    ministry: payload.ministry,
    job_category: payload.jobCategory,
    district: payload.district,
    monthly_salary_ugx: payload.monthlySalaryUgx,
    phone: payload.phone,
    provider: payload.provider,
    pin: payload.pin,
  });
}

/**
 * Step 1: verify employee_id + PIN.
 * If the user has 2FA enabled the response will have requiresTwoFa=true
 * and a partialToken. Follow up with verifyPhone() to get the real JWT.
 * @param {{ employeeId: string, pin: string }} credentials
 */
export function login(credentials) {
  return apiClient.post('/auth/login', {
    employee_id: credentials.employeeId,
    pin: credentials.pin,
  });
}

/**
 * Step 2 (2FA only): verify registered phone number.
 * @param {string} partialToken  – token received from login step 1
 * @param {string} phone         – user's registered mobile number
 */
export function verifyPhone(partialToken, phone) {
  return apiClient.post('/auth/verify-phone', {
    partial_token: partialToken,
    phone,
  });
}

export function getMe() {
  return apiClient.get('/auth/me');
}

/**
 * Verify the current user's PIN before a sensitive action.
 * Returns 200 on success, throws 400 if PIN is wrong.
 * @param {string} pin
 */
export function verifyPin(pin) {
  return apiClient.post('/auth/verify-pin', { pin });
}
