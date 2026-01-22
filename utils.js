/**
 * UTILITY FUNCTIONS
 * Helper functions for formatting, validation, and common operations
 */

// ============================================================
// DATE FORMATTING
// ============================================================

/**
 * Format date string to readable format
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date like "Jan 15, 2024"
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get today's date in YYYY-MM-DD format (for form default)
 * @returns {string}
 */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T');
}

// ============================================================
// CURRENCY FORMATTING
// ============================================================

/**
 * Format number as currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted like "$12.50"
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format amount for display (with currency symbol)
 * @param {number} amount
 * @returns {string}
 */
function formatAmount(amount) {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  return formatCurrency(amount);
}

// ============================================================
// FORM VALIDATION (CLIENT-SIDE)
// ============================================================

/**
 * Validate expense form data
 * @param {Object} formData - { date, amount, category, description }
 * @returns {string|null} Error message or null if valid
 */
function validateExpenseForm(formData) {
  // Date validation
  if (!formData.date) {
    return 'Date is required';
  }
  
  const expenseDate = new Date(formData.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (expenseDate > today) {
    return 'Date cannot be in the future';
  }

  // Amount validation
  if (!formData.amount || formData.amount === '') {
    return 'Amount is required';
  }
  
  const amount = parseFloat(formData.amount);
  if (isNaN(amount)) {
    return 'Amount must be a valid number';
  }
  
  if (amount <= 0) {
    return 'Amount must be greater than $0.00';
  }
  
  if (amount > 999999) {
    return 'Amount is too large';
  }

  // Category validation
  if (!formData.category) {
    return 'Category is required';
  }

  // If all checks pass
  return null;
}

/**
 * Validate a single field
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @returns {string|null} Error message or null
 */
function validateField(field, value) {
  switch (field) {
    case 'date':
      if (!value) return 'Date is required';
      if (new Date(value) > new Date()) return 'Date cannot be in the future';
      return null;
    
    case 'amount':
      if (!value || value === '') return 'Amount is required';
      if (isNaN(parseFloat(value))) return 'Amount must be a number';
      if (parseFloat(value) <= 0) return 'Amount must be positive';
      return null;
    
    case 'category':
      if (!value) return 'Category is required';
      return null;
    
    case 'description':
      if (value && value.length > 255) return 'Description too long';
      return null;
    
    default:
      return null;
  }
}

// ============================================================
// ARRAY/DATA OPERATIONS
// ============================================================

/**
 * Calculate total of all expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Sum of all amounts
 */
function calculateTotal(expenses) {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return 0;
  }
  
  return expenses.reduce((sum, expense) => {
    return sum + (parseFloat(expense.amount) || 0);
  }, 0);
}

/**
 * Group expenses by category
 * @param {Array} expenses
 * @returns {Object} { category: [expenses] }
 */
function groupByCategory(expenses) {
  return expenses.reduce((groups, expense) => {
    const category = expense.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(expense);
    return groups;
  }, {});
}

/**
 * Sort expenses by date (newest first)
 * @param {Array} expenses
 * @returns {Array} Sorted expenses
 */
function sortByDateDesc(expenses) {
  return [...expenses].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
}

// ============================================================
// STRING UTILITIES
// ============================================================

/**
 * Truncate string with ellipsis
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
function truncate(str, length = 50) {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Escape HTML special characters (prevent XSS)
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

// ============================================================
// LOCAL STORAGE
// ============================================================

/**
 * Save to local storage
 * @param {string} key
 * @param {any} value
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
}

/**
 * Load from local storage
 * @param {string} key
 * @returns {any} Stored value or null
 */
function loadFromStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Storage error:', error);
    return null;
  }
}

// ============================================================
// DEBUGGING HELPERS
// ============================================================

/**
 * Log with timestamp and formatting
 * @param {string} message
 * @param {any} data
 */
function log(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

/**
 * Log error with formatting
 * @param {string} message
 * @param {Error} error
 */
function logError(message, error = null) {
  console.error(`❌ ${message}`, error);
}
