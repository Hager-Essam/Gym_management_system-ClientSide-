/**
 * Plan API Service
 * Handles membership plans
 */

import apiClient from './apiClient.js';

/**
 * Get all plans
 */

export async function getAllPlans(activeOnly = false) {
  try {
    const response = await apiClient.get('/api/plans', {
      params: {
        active: activeOnly ? 'true' : undefined,
      },
    });

    console.log('STATUS:', response.status);
    console.log('FULL RESPONSE:', response.data);

    return response.data.data?.plans
      ?? response.data.plans
      ?? [];

  } catch (error) {
    console.error('REQUEST ERROR:', error);
    console.error('ERROR MESSAGE:', error.message);
    console.error('STATUS:', error.response?.status);
    console.error('BACKEND RESPONSE:', error.response?.data);

    throw error;
  }
}


/**
 * Get active plans only
 */
export async function getActivePlans() {
  return getAllPlans(true);
}

/**
 * Get plan by ID
 */
export async function getPlanById(planId) {
  try {
    const response = await apiClient.get(`/api/plans/${planId}`);
    return response.data.plan;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load plan');
  }
}
