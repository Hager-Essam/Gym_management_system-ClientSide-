import apiClient from './apiClient.js';

export async function getApiHealth() {
  try {
    return await apiClient.get('/health');
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Unable to reach the API.'
    );
  }
}
