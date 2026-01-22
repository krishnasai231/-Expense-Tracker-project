// ============================================================
// EXPENSE VALIDATION
// ============================================================

const VALID_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Shopping',
  'Other'
];

/**
 * Validate expense object
 * @param {Object} expense - Expense to validate
 * @returns {Object} { isValid: bool, errors: [] }
 */
function validateExpense(expense) {
  const errors = [];

  // Date validation
  if (!expense.date) {
    errors.push({ field: 'date', message: 'Date is required' });
  } else if (!isValidDate(expense.date)) {
    errors.push({ field: 'date', message: 'Invalid date format (use YYYY-MM-DD)' });
  } else if (new Date(expense.date) > new Date()) {
    errors.push({ field: 'date', message: 'Date cannot be in the future' });
  }

  // Amount validation
  if (expense.amount === undefined || expense.amount === null || expense.amount === '') {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else if (isNaN(expense.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a number' });
  } else if (parseFloat(expense.amount) <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
  } else if (parseFloat(expense.amount) > 999999) {
    errors.push({ field: 'amount', message: 'Amount too large' });
  }

  // Category validation
  if (!expense.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (!VALID_CATEGORIES.includes(expense.category)) {
    errors.push({
      field: 'category',
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
    });
  }

  // Description validation (optional, but if provided, check length)
  if (expense.description && typeof expense.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be text' });
  } else if (expense.description && expense.description.length > 255) {
    errors.push({ field: 'description', message: 'Description too long (max 255 chars)' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if string is valid date (YYYY-MM-DD)
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Sanitize expense data (remove extra fields)
 * @param {Object} expense
 * @returns {Object} Sanitized expense
 */
function sanitizeExpense(expense) {
  return {
    date: expense.date?.trim(),
    amount: parseFloat(expense.amount),
    category: expense.category?.trim(),
    description: expense.description?.trim() || null
  };
}

module.exports = {
  validateExpense,
  isValidDate,
  sanitizeExpense,
  VALID_CATEGORIES
};
