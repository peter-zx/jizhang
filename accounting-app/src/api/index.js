import apiClient from './client';

// 认证相关API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getCurrentUser: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  updateSettings: (data) => apiClient.put('/auth/settings', data),
  unlockSettings: (userId) => apiClient.post('/auth/unlock-settings', { userId }),
  generateInviteCode: (data) => apiClient.post('/auth/invite-codes', data),
  getInviteCodes: () => apiClient.get('/auth/invite-codes')
};

// 成员相关API
export const memberAPI = {
  getMembers: (params) => apiClient.get('/members', { params }),
  getMemberById: (id) => apiClient.get(`/members/${id}`),
  createMember: (data) => apiClient.post('/members', data),
  updateMember: (id, data) => apiClient.put(`/members/${id}`, data),
  deleteMember: (id, password) => apiClient.delete(`/members/${id}`, { data: { password } }),
  getExpiringDocuments: (days = 30) => apiClient.get('/members/expiring', { params: { days } }),
  uploadFiles: (id, formData) => apiClient.post(`/members/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadFiles: (id) => apiClient.get(`/members/${id}/download`, { responseType: 'blob' }),
  importMembers: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/members/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  downloadTemplate: () => apiClient.get('/members/template/download', { responseType: 'blob' }),
  bulkSetAmount: (data) => apiClient.post('/members/bulk/amount', data),
  bulkSetContract: (data) => apiClient.post('/members/bulk/contract', data)
};

// 账本相关API
export const accountingAPI = {
  getRecords: (params) => apiClient.get('/accounting', { params }),
  createRecord: (data) => apiClient.post('/accounting', data),
  updateRecord: (id, data) => apiClient.put(`/accounting/${id}`, data),
  deleteRecord: (id) => apiClient.delete(`/accounting/${id}`),
  getStatistics: (params) => apiClient.get('/accounting/statistics', { params })
};

// 用户和分销商相关API
export const userAPI = {
  getDistributors: () => apiClient.get('/users/distributors'),
  getDistributorById: (id) => apiClient.get(`/users/distributors/${id}`),
  updateDistributor: (id, data) => apiClient.put(`/users/distributors/${id}`, data),
  getOperationLogs: (params) => apiClient.get('/users/logs', { params })
};

// 导出相关API
export const exportAPI = {
  exportMembers: () => {
    return apiClient.get('/export/members', { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `成员列表_${new Date().toLocaleDateString()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  },
  exportRecords: (params) => {
    return apiClient.get('/export/records', { params, responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `账本记录_${new Date().toLocaleDateString()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  },
  exportFullReport: () => {
    return apiClient.get('/export/full-report', { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `完整报表_${new Date().toLocaleDateString()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  }
};

// 人员海和劳动任务API
export const laborAPI = {
  getMemberPool: (params) => apiClient.get('/labor/pool', { params }),
  addToPool: (data) => apiClient.post('/labor/pool', data),
  getLaborTasks: (params) => apiClient.get('/labor/tasks', { params }),
  createLaborTask: (data) => apiClient.post('/labor/tasks', data),
  startTask: (data) => apiClient.post('/labor/tasks/start', data),
  exitLaborTask: (taskId, data) => apiClient.post(`/labor/tasks/${taskId}/exit`, data)
};

// 月度账单API
export const billingAPI = {
  getMonthlyBills: (params) => apiClient.get('/billing/bills', { params }),
  confirmBill: (id, data) => apiClient.post(`/billing/bills/${id}/confirm`, data),
  getCurrentMonthStats: () => apiClient.get('/billing/stats/current'),
  getAdminSummary: () => apiClient.get('/billing/stats/admin-summary'),
  getMonthlyRentCollection: (params) => apiClient.get('/billing/rent-collection', { params }),
  getReminders: () => apiClient.get('/billing/reminders'),
  markReminderRead: (id) => apiClient.post(`/billing/reminders/${id}/read`),
  generateMonthlyReminder: () => apiClient.post('/billing/reminders/generate')
};
