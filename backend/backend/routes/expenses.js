const express = require('express');
const router = express.Router();

const {
  fetchAllExpenses,
  createExpense,
  updateExpenseData,
  removeExpense,
  getCategories,
  getSummary
} = require('../controllers/expenseController');

// ============================================================
// ROUTE DEFINITIONS
// ============================================================

// GET /api/expenses - Get all expenses
router.get('/', fetchAllExpenses);

// GET /api/expenses/categories - Get available categories
router.get('/categories', getCategories);

// GET /api/expenses/summary - Get spending summary
router.get('/summary', getSummary);

// POST /api/expenses - Create new expense
router.post('/', createExpense);

// PUT /api/expenses/:id - Update expense
router.put('/:id', updateExpenseData);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', removeExpense);

module.exports = router;
