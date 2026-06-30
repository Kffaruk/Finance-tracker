import api from './axios'

// ── Auth ──
export const authAPI = {
  register:        (data)         => api.post('/auth/register', data),
  login:           (data)         => api.post('/auth/login', data),
  getMe:           ()             => api.get('/auth/me'),
  updateProfile:   (data)         => api.put('/auth/update-profile', data),
  changePassword:  (data)         => api.put('/auth/change-password', data),
  forgotPassword:  (data)         => api.post('/auth/forgot-password', data),
  resetPassword:   (data)         => api.post('/auth/reset-password', data),
  verifyEmail:     (token)        => api.get(`/auth/verify-email?token=${token}`),
}

// ── Transactions ──
export const transactionAPI = {
  getAll:        (params)         => api.get('/transactions', { params }),
  getOne:        (id)             => api.get(`/transactions/${id}`),
  getDashboard:  (params)         => api.get('/transactions/summary/dashboard', { params }),
  create:        (formData)       => api.post('/transactions', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:        (id, formData)   => api.put(`/transactions/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:        (id)             => api.delete(`/transactions/${id}`),
}

// ── Categories ──
export const categoryAPI = {
  getAll:   (params)   => api.get('/categories', { params }),
  create:   (data)     => api.post('/categories', data),
  update:   (id, data) => api.put(`/categories/${id}`, data),
  delete:   (id)       => api.delete(`/categories/${id}`),
}

// ── Accounts ──
export const accountAPI = {
  getAll:   ()         => api.get('/accounts'),
  create:   (data)     => api.post('/accounts', data),
  update:   (id, data) => api.put(`/accounts/${id}`, data),
  delete:   (id)       => api.delete(`/accounts/${id}`),
}

// ── Budgets ──
export const budgetAPI = {
  getAll:      (params)   => api.get('/budgets', { params }),
  getOverview: (params)   => api.get('/budgets/overview', { params }),
  create:      (data)     => api.post('/budgets', data),
  update:      (id, data) => api.put(`/budgets/${id}`, data),
  delete:      (id)       => api.delete(`/budgets/${id}`),
}

// ── Reports ──
export const reportAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getYearly:  (params) => api.get('/reports/yearly', { params }),
}

// ── Export ──
export const exportAPI = {
  pdf:   (params) => api.get('/export/pdf',   { params, responseType: 'blob' }),
  excel: (params) => api.get('/export/excel', { params, responseType: 'blob' }),
}

// ── Backup ──
export const backupAPI = {
  export:  ()     => api.get('/backup/export'),
  restore: (data) => api.post('/backup/restore', data),
}
