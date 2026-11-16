import apiClient from './apiClient.js';

function extractErrorMessage(error, fallback) {
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

/** List attendance records (admin/manager only). */
export async function getAllAttendance(params = {}) {
  try {
    const response = await apiClient.get('/api/attendance', { params });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load attendance'));
  }
}

/** Get today's attendance and current gym occupancy (admin/manager only). */
export async function getTodayAttendance() {
  try {
    const response = await apiClient.get('/api/attendance/today');
    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Failed to load today's attendance")
    );
  }
}

/** Check in the specified member. */
export async function checkIn(userId, location) {
  try {
    const response = await apiClient.post('/api/attendance/check-in', {
      userId,
      ...(location ? { location } : {}),
    });
    return response.data.attendance ?? response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Check-in failed'));
  }
}

/** Check out an active attendance record. */
export async function checkOut(attendanceId) {
  try {
    const response = await apiClient.post('/api/attendance/check-out', {
      attendanceId,
    });
    return response.data.attendance ?? response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Check-out failed'));
  }
}
