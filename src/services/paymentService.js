/**
 * Payment API Service
 * Handles payment history
 */

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

/** Get a member's payments. */
export async function getMyPayments(userId, params = {}) {
  if (!userId) throw new Error('A member ID is required to load payments.');

  try {
    const response = await apiClient.get(
      `/api/payments/member/${userId}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load payments'));
  }
}

/** List all payments (admin/manager only). */
export async function getAllPayments(params = {}) {
  try {
    const response = await apiClient.get('/api/payments', { params });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load payments'));
  }
}

/** Payment totals and revenue by month (admin/manager only). */
export async function getPaymentStats(params = {}) {
  try {
    const response = await apiClient.get('/api/payments/stats', { params });
    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load payment statistics')
    );
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId) {
  try {
    const response = await apiClient.get(`/api/payments/${paymentId}`);
    return response.data.payment ?? response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load payment'));
  }
}
