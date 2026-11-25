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

/** Get the signed-in member's payment history. */
export async function getMyPayments(params = {}) {
  try {
    const response = await apiClient.get('/api/payments/history', { params });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load payments'));
  }
}

/** Create or resume the backend's mock checkout session. */
export async function createCheckout(data) {
  try {
    const response = await apiClient.post('/api/payments/checkout', data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to start checkout'));
  }
}

/** Confirm a checkout session; payment outcomes are decided by the server. */
export async function confirmCheckout(paymentId) {
  try {
    const response = await apiClient.post(`/api/payments/${paymentId}/confirm`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to confirm payment'));
  }
}

/** Record an admin-created payment for a pending subscription. */
export async function recordManualPayment(data) {
  try {
    const response = await apiClient.post('/api/payments', data);
    return response.data.payment ?? response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to record payment'));
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
