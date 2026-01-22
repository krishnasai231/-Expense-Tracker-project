const {
  getAllExpenses,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} = require('../models/database');

const {
  validateExpense,
  sanitizeExpense,
  VALID_CATEGORIES
} = require('../utils/validators');

// ============================================================
// BUSINESS LOGIC LAYER
// ============================================================

/**
 * Get all expenses with optional filtering
 */
async function fetchAllExpenses(req, res, next) {
  try {
    const expenses = await getAllExpenses(req.query);
    
    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new expense
 */
async function createExpense(req, res, next) {
  try {
    // Sanitize input
    const sanitized = sanitizeExpense(req.body);

    // Validate input
    const { isValid, errors } = validateExpense(sanitized);
    if (!isValid) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = { errors };
      throw error;
    }

    // Save to database
    const expense = await addExpense(sanitized);

    // Return created expense with 201 status
    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update existing expense
 */
async function updateExpenseData(req, res, next) {
  try {
    const { id } = req.params;

    // Check if expense exists
    const existing = await getExpenseById(id);
    if (!existing) {
      const error = new Error(`Expense with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Merge existing with updates
    const updates = sanitizeExpense({ ...existing, ...req.body });

    // Validate merged data
    const { isValid, errors } = validateExpense(updates);
    if (!isValid) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = { errors };
      throw error;
    }

    // Update in database
    const updated = await updateExpense(id, updates);

    res.json({
      success: true,
      data: updated,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete expense
 */
async function removeExpense(req, res, next) {
  try {
    const { id } = req.params;

    // Check if expense exists first
    const existing = await getExpenseById(id);
    if (!existing) {
      const error = new Error(`Expense with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Delete from database
    await deleteExpense(id);

    res.json({
      success: true,
      message: 'Expense deleted successfully',
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get categories list (for frontend dropdown)
 */
function getCategories(req, res) {
  res.json({
    success: true,
    data: VALID_CATEGORIES
  });
}

/**
 * Get summary statistics
 */
async function getSummary(req, res, next) {
  try {
    const summary = await getExpenseSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  fetchAllExpenses,
  createExpense,
  updateExpenseData,
  removeExpense,
  getCategories,
  getSummary
};
