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

export function getClasses(params = {}) {
  return request(() => apiClient.get('/api/classes', { params }), 'Failed to load classes');
}

export function getClassSchedules(params = {}) {
  return request(
    () => apiClient.get('/api/classes/schedules', { params }),
    'Failed to load class schedules'
  );
}

export function getMyClassBookings(params = {}) {
  return request(
    () => apiClient.get('/api/classes/my-bookings', { params }),
    'Failed to load your class bookings'
  );
}

export async function bookClass(scheduleId) {
  const result = await request(
    () => apiClient.post(`/api/classes/schedules/${scheduleId}/book`, {}),
    'Unable to book this class'
  );
  return result.booking;
}

export async function cancelClassBooking(bookingId) {
  const result = await request(
    () => apiClient.delete(`/api/classes/bookings/${bookingId}`),
    'Unable to cancel this class booking'
  );
  return result.booking;
}

export function getAdminClasses(params = {}) {
  return request(
    () => apiClient.get('/api/admin/classes', { params }),
    'Failed to load class management data'
  );
}

export async function createClass(classData) {
  const result = await request(
    () => apiClient.post('/api/admin/classes', classData),
    'Unable to create class'
  );
  return result.class;
}

export async function updateClass(classId, classData) {
  const result = await request(
    () => apiClient.put(`/api/admin/classes/${classId}`, classData),
    'Unable to update class'
  );
  return result.class;
}

export async function setClassStatus(classId, isActive) {
  const result = await request(
    () => apiClient.patch(`/api/admin/classes/${classId}/status`, { isActive }),
    'Unable to update class status'
  );
  return result.class;
}

export async function deleteClass(classId) {
  return request(
    () => apiClient.delete(`/api/admin/classes/${classId}`),
    'Unable to delete class'
  );
}

export function getAdminClassSchedules(params = {}) {
  return request(
    () => apiClient.get('/api/admin/class-schedules', { params }),
    'Failed to load class schedules'
  );
}

export async function createClassSchedule(scheduleData) {
  const result = await request(
    () => apiClient.post('/api/admin/class-schedules', scheduleData),
    'Unable to create class schedule'
  );
  return result.schedule;
}

export async function updateClassSchedule(scheduleId, scheduleData) {
  const result = await request(
    () => apiClient.put(`/api/admin/class-schedules/${scheduleId}`, scheduleData),
    'Unable to update class schedule'
  );
  return result.schedule;
}

export async function setClassScheduleStatus(scheduleId, status, cancellationReason = '') {
  const result = await request(
    () =>
      apiClient.patch(`/api/admin/class-schedules/${scheduleId}/status`, {
        status,
        cancellationReason,
      }),
    'Unable to update schedule status'
  );
  return result.schedule;
}

export async function cancelClassSchedule(scheduleId, reason) {
  const result = await request(
    () =>
      apiClient.delete(`/api/admin/class-schedules/${scheduleId}`, {
        data: { reason },
      }),
    'Unable to cancel class schedule'
  );
  return result.schedule;
}

export function getAdminClassBookings(params = {}) {
  return request(
    () => apiClient.get('/api/admin/class-bookings', { params }),
    'Failed to load class bookings'
  );
}

export async function createAdminClassBooking(data) {
  const result = await request(
    () => apiClient.post('/api/admin/class-bookings', data),
    'Unable to create class booking'
  );
  return result.booking;
}

export async function updateClassBookingStatus(bookingId, status) {
  const result = await request(
    () => apiClient.patch(`/api/admin/class-bookings/${bookingId}/status`, { status }),
    'Unable to update class booking'
  );
  return result.booking;
}

export async function cancelAdminClassBooking(bookingId, reason) {
  const result = await request(
    () =>
      apiClient.delete(`/api/admin/class-bookings/${bookingId}`, {
        data: { reason },
      }),
    'Unable to cancel class booking'
  );
  return result.booking;
}
