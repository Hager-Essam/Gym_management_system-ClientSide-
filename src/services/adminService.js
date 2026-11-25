import apiClient from './apiClient.js';

function getErrorMessage(error, fallback) {
  if (!error.response) {
    return 'We could not reach the server. Check your connection and try again.';
  }

  const data = error.response.data;
  if (data?.error || data?.message) return data.error || data.message;
  if (Array.isArray(data?.errors)) {
    return data.errors.map((item) => item.message || item.msg).filter(Boolean).join(' ');
  }

  return error.message || fallback;
}

async function request(callback, fallback) {
  try {
    const response = await callback();
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export async function getAdminDashboard() {
  const result = await request(
    () => apiClient.get('/api/admin/dashboard'),
    'Failed to load dashboard data'
  );
  return result;
}

export async function getAdminReport(report, params = {}) {
  const result = await request(
    () => apiClient.get(`/api/admin/reports/${report}`, { params }),
    `Failed to load ${report} report`
  );
  return result;
}

export async function getAdminAuditLogs(params = {}) {
  const result = await request(
    () => apiClient.get('/api/admin/audit-logs', { params }),
    'Failed to load audit log'
  );
  return result;
}

export async function getSystemSettings() {
  const result = await request(
    () => apiClient.get('/api/admin/settings'),
    'Failed to load system settings'
  );
  return result.settings || [];
}

export async function updateSystemSetting(key, value) {
  const result = await request(
    () => apiClient.put(`/api/admin/settings/${encodeURIComponent(key)}`, { value }),
    'Unable to save system setting'
  );
  return result.setting;
}

export async function createMember(memberData) {
  const result = await request(
    () => apiClient.post('/api/members', memberData),
    'Unable to create member'
  );
  return result.member;
}

export async function updateMemberStatus(memberId, status) {
  const result = await request(
    () => apiClient.patch(`/api/members/${memberId}/status`, { status }),
    'Unable to update member status'
  );
  return result.member;
}

export async function getAllUsers() {
  const [membersResult, trainers, staff] = await Promise.all([
    request(
      () => apiClient.get('/api/members', { params: { page: 1, limit: 100 } }),
      'Failed to load members'
    ),
    request(
      () => apiClient.get('/api/admin/trainers', { params: { page: 1, limit: 100 } }),
      'Failed to load trainers'
    ),
    request(
      () => apiClient.get('/api/admin/staff', { params: { page: 1, limit: 100 } }),
      'Failed to load staff'
    ),
  ]);

  const normalize = (user, role) => ({
    ...user,
    role,
    fullName: user.fullName || user.full_name || '',
    createdAt: user.createdAt || user.created_at || null,
  });

  return [
    ...(membersResult.members || []).map((user) => normalize(user, 'member')),
    ...(trainers.trainers || []).map((user) => normalize(user, 'trainer')),
    ...(staff.staff || []).map((user) => normalize(user, user.role)),
  ];
}
