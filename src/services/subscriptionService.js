/**
 * Subscription API Service
 *
 * Real backend routes (see src/modules/subscriptions/subscriptionRoutes.js):
 *   POST   /api/subscriptions        create (member/admin/manager)
 *   GET    /api/subscriptions/:id    read one
 *   PUT    /api/subscriptions/:id    update (admin only)
 *   DELETE /api/subscriptions/:id    cancel (any signed-in user)
 *
 * A member's own subscription list lives at
 * GET /api/members/:id/subscription (see memberService.js).
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

/** Create a subscription and activate the member immediately. */
export async function createSubscription(subscriptionData) {
  try {
    const response = await apiClient.post('/api/subscriptions', subscriptionData);
    return response.data.subscription ?? response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to create subscription')
    );
  }
}

/** List subscriptions (admin/manager only). */
export async function getAllSubscriptions(params = {}) {
  try {
    const response = await apiClient.get('/api/subscriptions', { params });
    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load subscriptions')
    );
  }
}

/** List active subscriptions expiring soon (admin/manager only). */
export async function getExpiringSubscriptions(days = 7) {
  try {
    const response = await apiClient.get('/api/subscriptions/expiring', {
      params: { days },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load expiring subscriptions')
    );
  }
}

/** Get a subscription by ID. */
export async function getSubscriptionById(subscriptionId) {
  try {
    const response = await apiClient.get(`/api/subscriptions/${subscriptionId}`);
    return response.data.subscription ?? response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load subscription')
    );
  }
}

/** Cancel one subscription by id. Reason is optional. */
export async function cancelSubscription(subscriptionId, reason = '') {
  try {
    const response = await apiClient.delete(
      `/api/subscriptions/${subscriptionId}`,
      { data: reason ? { reason } : {} }
    );

    return response.data?.subscription ?? response.data ?? null;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to cancel subscription')
    );
  }
}

/** Admin-only status/auto-renew/date update. */
export async function updateSubscription(subscriptionId, data) {
  try {
    const response = await apiClient.put(
      `/api/subscriptions/${subscriptionId}`,
      data
    );

    return response.data.subscription ?? response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to update subscription')
    );
  }
}

async function updateSubscriptionAction(subscriptionId, data, fallback) {
  try {
    const response = await apiClient.patch(
      `/api/subscriptions/${subscriptionId}/${data.action}`,
      data.body || {}
    );
    return response.data.subscription ?? response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, fallback));
  }
}

export function approveSubscription(subscriptionId) {
  return updateSubscriptionAction(
    subscriptionId,
    { action: 'approve' },
    'Failed to approve subscription'
  );
}

export function rejectSubscription(subscriptionId, reason = '') {
  return updateSubscriptionAction(
    subscriptionId,
    { action: 'reject', body: { reason } },
    'Failed to reject subscription'
  );
}

export async function renewSubscription(subscriptionId) {
  try {
    const response = await apiClient.post(
      `/api/subscriptions/${subscriptionId}/renew`
    );
    return response.data.subscription ?? response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to renew subscription')
    );
  }
}
