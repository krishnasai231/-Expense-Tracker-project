/**
 * API COMMUNICATION LAYER
 * Handles all HTTP requests to backend
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * Parse error response from API
 * @param {Response} response
 * @returns {Promise<Error>}
 */
async function handleErrorResponse(response) {
  try {
    const errorData = await response.json();
    const error = new Error(
      errorData.error?.message || 'An error occurred'
    );
    error.statusCode = response.status;
    error.code = errorData.error?.code;
    error.details = errorData.error?.details;
    return error;
  } catch (e) {
    // If response isn't JSON, create generic error
    return new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

/**
 * Handle network/fetch errors
 * @param {Error} error
 * @returns {Error}
 */
function handleNetworkError(error) {
  const err = new Error(
    'Network error. Check your internet connection.'
  );
  err.originalError = error;
  return err;
}

// ============================================================
// FETCH WRAPPER
// ============================================================

/**
 * Make HTTP request with error handling
 * @param {string} url
 * @param {string} method
 * @param {any} body
 * @returns {Promise<any>}
 */
async function fetchAPI(url, method = 'GET', body = null) {
  try {
    // Build request options
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    // Make request
    log(`${method} ${url}`);
    const response = await fetch(url, options);

    // Handle non-OK responses
    if (!response.ok) {
      const error = await handleErrorResponse(response);
      throw error;
    }

    // Parse and return JSON
    const data = await response.json();
    return data;

  } catch (error) {
    // Distinguish between API errors and network errors
    if (error.statusCode) {
      // It's an API error
      throw error;
    } else {
      // It's a network error
      throw handleNetworkError(error);
    }
  }
}

// ============================================================
// EXPENSE ENDPOINTS
// ============================================================

/**
 * Get all expenses
 * @param {Object} filters - Optional: { category, minAmount, maxAmount }
 * @returns {Promise<Array>}
 */
async function getExpenses(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.minAmount) params.append('minAmount', filters.minAmount);
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

    const url = `${API_BASE_URL}/expenses${params ? '?' + params : ''}`;
    const response = await fetchAPI(url);

    return response.data || [];
  } catch (error) {
    logError('Failed to fetch expenses', error);
    throw error;
  }
}

/**
 * Add new expense
 * @param {Object} expense - { date, amount, category, description }
 * @returns {Promise<Object>} Created expense with ID
 */
async function addExpense(expense) {
  try {
    const response = await fetchAPI(
      `${API_BASE_URL}/expenses`,
      'POST',
      expense
    );
    return response.data;
  } catch (error) {
    logError('Failed to add expense', error);
    throw error;
  }
}

/**
 * Update expense
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateExpense(id, updates) {
  try {
    const response = await fetchAPI(
      `${API_BASE_URL}/expenses/${id}`,
      'PUT',
      updates
    );
    return response.data;
  } catch (error) {
    logError('Failed to update expense', error);
    throw error;
  }
}

/**
 * Delete expense
 * @param {number} id
 * @returns {Promise<boolean>}
 */
async function deleteExpense(id) {
  try {
    const response = await fetchAPI(
      `${API_BASE_URL}/expenses/${id}`,
      'DELETE'
    );
    return response.success;
  } catch (error) {
    logError('Failed to delete expense', error);
    throw error;
  }
}

/**
 * Get available categories
 * @returns {Promise<Array>}
 */
async function getCategories() {
  try {
    const response = await fetchAPI(`${API_BASE_URL}/expenses/categories`);
    return response.data || [];
  } catch (error) {
    logError('Failed to fetch categories', error);
    throw error;
  }
}

/**
 * Get spending summary
 * @returns {Promise<Object>}
 */
async function getSummary() {
  try {
    const response = await fetchAPI(`${API_BASE_URL}/expenses/summary`);
    return response.data || {};
  } catch (error) {
    logError('Failed to fetch summary', error);
    throw error;
  }
}
