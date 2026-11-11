/**
 * Member API Service
 * Handles member profile and related operations
 */

import apiClient from './apiClient.js';

/**
 * Get current user's profile
 */
export async function getMyProfile() {
  try {
    const response = await apiClient.get('/api/members/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load profile');
  }
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(profileData) {
  try {
    const response = await apiClient.patch('/api/members/me', profileData);
    return response.data.data.response;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update profile');
  }
}

/**
 * Get all members (admin/manager only)
 */
export async function getAllMembers(params = {}) {
  try {
    const response = await apiClient.get('/api/members', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load members');
  }
}

/**
 * Get member by ID (admin/manager only)
 */
export async function getMemberById(memberId) {
  try {
    const response = await apiClient.get(`/api/members/${memberId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load member');
  }
}
