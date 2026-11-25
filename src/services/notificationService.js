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

export function getNotifications() {
  return request(
    () => apiClient.get('/api/notifications'),
    'Failed to load notifications'
  );
}

export async function markNotificationRead(notificationId) {
  const result = await request(
    () => apiClient.patch(`/api/notifications/${notificationId}/read`),
    'Unable to mark notification as read'
  );
  return result.notification;
}

export function markAllNotificationsRead() {
  return request(
    () => apiClient.patch('/api/notifications/read-all'),
    'Unable to mark notifications as read'
  );
}

export function sendAdminNotification(data) {
  return request(
    () => apiClient.post('/api/admin/notifications', data),
    'Unable to send notification'
  );
}
