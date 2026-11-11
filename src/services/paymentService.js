/**
 * Payment API Service
 * Handles payment history
 */

import apiClient from './apiClient.js';

/**
 * Get current user's payments
 */
export async function getMyPayments(params = {}) {
  try {
    const response = await apiClient.get('/api/payments/me', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load payments');
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId) {
  try {
    const response = await apiClient.get(`/api/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load payment');
  }
}
