import apiClient from './client';

// 认证相关API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getCurrentUser: () => apiClient.get('/auth/me'),
  generateInviteCode: (data) => apiClient.post('/auth/invite-codes', data),
  getInviteCodes: () => apiClient.get('/auth/invite-codes')
};

// 成员相关API
export const memberAPI = {
  getMembers: (params) => apiClient.get('/members', { params }),
  getMemberById: (id) => apiClient.get(`/members/${id}`),
  createMember: (data) => apiClient.post('/members', data),
  updateMember: (id, data) => apiClient.put(`/members/${id}`, data),
  deleteMember: (id) => apiClient.delete(`/members/${id}`),
  getExpiringDocuments: (days = 30) => apiClient.get('/members/expiring', { params: { days } })
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
