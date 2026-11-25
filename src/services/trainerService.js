import apiClient from './apiClient.js';

function getErrorMessage(error, fallback) {
  if (!error.response) {
    return 'We could not reach the server. Check your connection and try again.';
  }

  return (
    error.response.data?.error ||
    error.response.data?.message ||
    error.message ||
    fallback
  );
}

async function request(callback, fallback) {
  try {
    const response = await callback();
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export async function getTrainers(params = {}) {
  const result = await request(
    () => apiClient.get('/api/trainers', { params }),
    'Failed to load trainers'
  );
  return result.trainers || [];
}

export async function getMyTrainerAssignments() {
  const result = await request(
    () => apiClient.get('/api/trainers/me/assignments'),
    'Failed to load your trainers'
  );
  return result.assignments || [];
}

export async function assignMyTrainer(trainerId, notes = '') {
  const result = await request(
    () => apiClient.post(`/api/trainers/${trainerId}/assign`, { notes }),
    'Unable to assign this trainer'
  );
  return result.assignment;
}

export async function endMyTrainerAssignment(assignmentId) {
  const result = await request(
    () => apiClient.delete(`/api/trainers/me/assignments/${assignmentId}`),
    'Unable to end this trainer assignment'
  );
  return result.assignment;
}

function normalizeStaff(record) {
  return {
    ...record,
    fullName: record.fullName || record.full_name || '',
    createdAt: record.createdAt || record.created_at,
  };
}

export async function getAdminTrainers(params = {}) {
  const result = await request(
    () => apiClient.get('/api/admin/trainers', { params }),
    'Failed to load trainers'
  );
  return (result.trainers || []).map(normalizeStaff);
}

export async function createAdminTrainer(data) {
  const result = await request(
    () => apiClient.post('/api/admin/trainers', data),
    'Unable to create trainer'
  );
  return normalizeStaff(result.trainer);
}

export async function updateAdminTrainer(trainerId, data) {
  const result = await request(
    () => apiClient.put(`/api/admin/trainers/${trainerId}`, data),
    'Unable to update trainer'
  );
  return normalizeStaff(result.trainer);
}

export async function updateAdminTrainerStatus(trainerId, status) {
  const result = await request(
    () => apiClient.patch(`/api/admin/trainers/${trainerId}/status`, { status }),
    'Unable to update trainer status'
  );
  return normalizeStaff(result.trainer);
}

export async function getAdminStaff(params = {}) {
  const result = await request(
    () => apiClient.get('/api/admin/staff', { params }),
    'Failed to load staff'
  );
  return (result.staff || []).map(normalizeStaff);
}

export async function createAdminStaff(data) {
  const result = await request(
    () => apiClient.post('/api/admin/staff', data),
    'Unable to create staff member'
  );
  return normalizeStaff(result.staff);
}

export async function updateAdminStaff(staffId, data) {
  const result = await request(
    () => apiClient.put(`/api/admin/staff/${staffId}`, data),
    'Unable to update staff member'
  );
  return normalizeStaff(result.staff);
}

export async function updateAdminStaffStatus(staffId, status) {
  const result = await request(
    () => apiClient.patch(`/api/admin/staff/${staffId}/status`, { status }),
    'Unable to update staff status'
  );
  return normalizeStaff(result.staff);
}

export function deleteAdminStaff(staffId) {
  return request(
    () => apiClient.delete(`/api/admin/staff/${staffId}`),
    'Unable to delete staff member'
  );
}

export async function getAdminTrainerAssignments(params = {}) {
  const result = await request(
    () => apiClient.get('/api/admin/member-trainer-assignments', { params }),
    'Failed to load trainer assignments'
  );
  return result.assignments || [];
}

export async function createAdminTrainerAssignment(data) {
  const result = await request(
    () => apiClient.post('/api/admin/member-trainer-assignments', data),
    'Unable to assign trainer'
  );
  return result.assignment;
}

export async function deleteAdminTrainerAssignment(assignmentId) {
  const result = await request(
    () => apiClient.delete(`/api/admin/member-trainer-assignments/${assignmentId}`),
    'Unable to end trainer assignment'
  );
  return result.assignment;
}
