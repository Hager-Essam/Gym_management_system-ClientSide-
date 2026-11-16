/**
 * Member API Service
 * Handles the current member's profile, subscriptions and attendance.
 *
 * The Axios response interceptor unwraps the HTTP body, so `response` here is
 * already `{ success, data }`.
 */

import apiClient from './apiClient.js';

/**
 * The API can reject a request with either `{ error: "message" }` or
 * `{ errors: [{ field, message }] }`. Turn both into one readable string.
 */
function extractErrorMessage(error, fallback) {
  // No response at all -> the API is unreachable, not a rejected request.
  if (!error.response) {
    return 'We could not reach the server. Check your connection and try again.';
  }

  const data = error.response.data;

  if (data?.error) return data.error;

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map((item) => item.message || item.msg)
      .filter(Boolean)
      .join(' ');
  }

  return error.message || fallback;
}

/** Get the current user's profile + active subscription. */
export async function getMyProfile() {
  try {
    const response = await apiClient.get('/api/members/me');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load profile'));
  }
}

/** Update the current user's profile. */
export async function updateMyProfile(profileData) {
  try {
    const response = await apiClient.patch('/api/members/me', profileData);
    return response.data.user;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update profile'));
  }
}

/** Get all members (admin/manager only). */
export async function getAllMembers(params = {}) {
  try {
    const response = await apiClient.get('/api/members', { params });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load members'));
  }
}

/** Get a member by id (owner or admin/manager). */
export async function getMemberById(memberId) {
  try {
    const response = await apiClient.get(`/api/members/${memberId}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load member'));
  }
}

/** All subscriptions for a member (owner or admin/manager). */
export async function getMemberSubscriptions(userId) {
  try {
    const response = await apiClient.get(
      `/api/members/${userId}/subscription`
    );

    return response.data.subscriptions ?? [];
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load subscriptions')
    );
  }
}

/**
 * Attendance history for a member.
 * @returns {{ attendance: Array, pagination: object|null }}
 */
export async function getMemberAttendance(userId, params = {}) {
  try {
    const response = await apiClient.get(
      `/api/members/${userId}/attendance`,
      { params }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load attendance')
    );
  }
}
