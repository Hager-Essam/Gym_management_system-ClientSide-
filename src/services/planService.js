/**
 * Plan API Service
 * Handles membership plans (public endpoints).
 *
 * The Axios response interceptor unwraps the HTTP body, so `response` here is
 * already `{ success, data }`.
 */

import apiClient from './apiClient.js';

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

function readPlans(response) {
  const payload = response?.data ?? response;
  return payload?.plans ?? (Array.isArray(payload) ? payload : []);
}

/**
 * Get all plans.
 * @param {boolean} activeOnly  true -> only active + visible plans
 *                              false -> every non-deleted plan (admin views)
 */
export async function getAllPlans(activeOnly = false) {
  try {
    const response = await apiClient.get('/api/plans', {
      params: {
        // Backend contract: GET /api/plans?activeOnly=true|false
        activeOnly: activeOnly ? 'true' : 'false',
      },
    });

    return readPlans(response);
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load membership plans')
    );
  }
}

/** Get active + visible plans only. */
export async function getActivePlans() {
  return getAllPlans(true);
}

/** Get a single plan by id. */
export async function getPlanById(planId) {
  try {
    const response = await apiClient.get(`/api/plans/${planId}`);
    const payload = response?.data ?? response;

    return payload?.plan ?? payload ?? null;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load plan'));
  }
}

/** Create a membership plan (admin only). */
export async function createPlan(planData) {
  try {
    const response = await apiClient.post('/api/plans', planData);
    const payload = response?.data ?? response;
    return payload?.plan ?? payload;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create plan'));
  }
}

/** Update a membership plan (admin only). */
export async function updatePlan(planId, planData) {
  try {
    const response = await apiClient.put(`/api/plans/${planId}`, planData);
    const payload = response?.data ?? response;
    return payload?.plan ?? payload;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update plan'));
  }
}

/** Delete a membership plan (admin only). */
export async function deletePlan(planId) {
  try {
    await apiClient.delete(`/api/plans/${planId}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete plan'));
  }
}
