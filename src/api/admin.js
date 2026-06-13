/**
 * Admin API calls (require admin role JWT).
 *
 * getOverview()                              → GET  /api/admin/overview
 * getUsers()                                 → GET  /api/admin/users
 * getUser(userId)                            → GET  /api/admin/users/:id
 * createEmployee(fields)                     → POST /api/admin/users
 * verifyUser(userId, status)                 → PUT  /api/admin/users/:id/verify
 * updateSalary(userId, salaryUgx)            → PUT  /api/admin/users/:id/salary
 * updateUserProfile(userId, fields)          → PUT  /api/admin/users/:id/profile
 * getAdminAdvances()                         → GET  /api/admin/advances
 * getAuditLogs()                             → GET  /api/admin/audit
 */
import apiClient from './client.js';

export function getOverview() {
  return apiClient.get('/admin/overview');
}

export function getUsers() {
  return apiClient.get('/admin/users');
}

export function getUser(userId) {
  return apiClient.get(`/admin/users/${userId}`);
}

/**
 * Admin creates a new public servant account and adds them to payroll.
 * @param {{ employeeId, fullName, ministry, jobCategory, district, monthlySalaryUgx, phone, provider, pin, verificationStatus?, email? }} fields
 */
export function createEmployee(fields) {
  return apiClient.post('/admin/users', {
    employee_id:         fields.employeeId,
    full_name:           fields.fullName,
    ministry:            fields.ministry,
    job_category:        fields.jobCategory,
    district:            fields.district,
    monthly_salary_ugx:  fields.monthlySalaryUgx,
    phone:               fields.phone,
    provider:            fields.provider,
    pin:                 fields.pin,
    verification_status: fields.verificationStatus ?? 'pending',
    email:               fields.email || undefined,
  });
}

/**
 * @param {string} userId
 * @param {'verified' | 'pending' | 'document_error'} verificationStatus
 */
export function verifyUser(userId, verificationStatus) {
  return apiClient.put(`/admin/users/${userId}/verify`, {
    verification_status: verificationStatus,
  });
}

/**
 * Set a servant's monthly salary. The daily accumulation is recomputed
 * server-side on every dashboard fetch.
 * @param {string} userId
 * @param {number} salaryUgx  — gross monthly salary in UGX (integer)
 */
export function updateSalary(userId, salaryUgx) {
  return apiClient.put(`/admin/users/${userId}/salary`, {
    monthly_salary_ugx: salaryUgx,
  });
}

/**
 * Update editable profile fields for a servant.
 * @param {string} userId
 * @param {{ fullName?, ministry?, jobCategory?, district?, phone?, provider?, verificationStatus? }} fields
 */
export function updateUserProfile(userId, fields) {
  const payload = {};
  if (fields.fullName           != null) payload.full_name           = fields.fullName;
  if (fields.ministry           != null) payload.ministry            = fields.ministry;
  if (fields.jobCategory        != null) payload.job_category        = fields.jobCategory;
  if (fields.district           != null) payload.district            = fields.district;
  if (fields.phone              != null) payload.phone               = fields.phone;
  if (fields.provider           != null) payload.provider            = fields.provider;
  if (fields.verificationStatus != null) payload.verification_status = fields.verificationStatus;
  return apiClient.put(`/admin/users/${userId}/profile`, payload);
}

export function getAdminAdvances() {
  return apiClient.get('/admin/advances');
}

export function getAuditLogs() {
  return apiClient.get('/admin/audit');
}

/**
 * Toggle two-factor authentication on/off for the authenticated admin.
 * Reuses the shared /users/2fa endpoint — available to all roles.
 */
export function toggleAdmin2FA() {
  return apiClient.put('/users/2fa');
}

/**
 * Change the authenticated admin's password.
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} fields
 */
export function changeAdminPassword(fields) {
  return apiClient.put('/admin/change-password', {
    current_password:  fields.currentPassword,
    new_password:      fields.newPassword,
    confirm_password:  fields.confirmPassword,
  });
}
