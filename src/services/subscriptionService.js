/**
 * Subscription API Service
 * Handles subscription management
 */

import apiClient from './apiClient.js';

/**
 * Get current user's subscription
 */
export async function getMySubscription() {
  try {
    const response = await apiClient.get('/api/subscriptions/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load subscription');
  }
}

/**
 * Create subscription
 */
export async function createSubscription(subscriptionData) {
  try {
    const response = await apiClient.post('/api/subscriptions', subscriptionData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create subscription');
  }
}

/**
 * Cancel current subscription
 */
export async function cancelSubscription() {
  try {
    const response = await apiClient.post('/api/subscriptions/me/cancel');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to cancel subscription');
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(subscriptionId, data) {
  try {
    const response = await apiClient.put(`/api/subscriptions/${subscriptionId}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update subscription');
  }
}
