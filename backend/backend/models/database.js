const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './data/database.db';

// Create data folder if it doesn't exist
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Open database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// ============================================================
// SCHEMA: Create table if it doesn't exist
// ============================================================

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Enable foreign keys (for future features with relationships)
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) reject(err);
      
      // Create expenses table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      db.run(createTableSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database schema initialized');
          resolve();
        }
      });
    });
  });
}

// ============================================================
// DATABASE OPERATIONS (CRUD)
// ============================================================

/**
 * Get all expenses
 * @param {Object} options - Query options (filter, sort)
 * @returns {Promise<Array>} Array of expense objects
 */
function getAllExpenses(options = {}) {
  return new Promise((resolve, reject) => {
    // Build WHERE clause for filters
    let whereClause = '';
    const params = [];
    
    if (options.category) {
      whereClause += 'category = ?';
      params.push(options.category);
    }
    
    if (options.minAmount && options.maxAmount) {
      whereClause += (whereClause ? ' AND ' : '') + 'amount BETWEEN ? AND ?';
      params.push(options.minAmount, options.maxAmount);
    }

    // SQL query with sorting
    let sql = 'SELECT * FROM expenses';
    if (whereClause) sql += ' WHERE ' + whereClause;
    sql += ' ORDER BY date DESC'; // Newest first

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(new Error(`Failed to fetch expenses: ${err.message}`));
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Get single expense by ID
 * @param {number} id - Expense ID
 * @returns {Promise<Object>} Expense object or null
 */
function getExpenseById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM expenses WHERE id = ?';
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(new Error(`Failed to fetch expense: ${err.message}`));
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Add new expense
 * @param {Object} expense - { date, amount, category, description }
 * @returns {Promise<Object>} Created expense with ID
 */
function addExpense(expense) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO expenses (date, amount, category, description)
      VALUES (?, ?, ?, ?)
    `;
    
    const params = [
      expense.date,
      expense.amount,
      expense.category,
      expense.description || null
    ];

    db.run(sql, params, function(err) {
      if (err) {
        reject(new Error(`Failed to add expense: ${err.message}`));
      } else {
        // Return newly created expense
        getExpenseById(this.lastID)
          .then(resolve)
          .catch(reject);
      }
    });
  });
}

/**
 * Update expense
 * @param {number} id - Expense ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated expense
 */
function updateExpense(id, updates) {
  return new Promise((resolve, reject) => {
    const allowedFields = ['date', 'amount', 'category', 'description'];
    const updateFields = [];
    const params = [];

    // Safely build SET clause only for allowed fields
    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      reject(new Error('No valid fields to update'));
      return;
    }

    params.push(id);
    const sql = `UPDATE expenses SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(sql, params, (err) => {
      if (err) {
        reject(new Error(`Failed to update expense: ${err.message}`));
      } else {
        getExpenseById(id)
          .then(resolve)
          .catch(reject);
      }
    });
  });
}

/**
 * Delete expense
 * @param {number} id - Expense ID
 * @returns {Promise<boolean>} True if deleted
 */
function deleteExpense(id) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM expenses WHERE id = ?';
    
    db.run(sql, [id], function(err) {
      if (err) {
        reject(new Error(`Failed to delete expense: ${err.message}`));
      } else if (this.changes === 0) {
        reject(new Error(`Expense with ID ${id} not found`));
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Get summary statistics
 * @returns {Promise<Object>} { totalExpenses, totalAmount, byCategory }
 */
function getExpenseSummary() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        COUNT(*) as totalCount,
        SUM(amount) as totalAmount,
        category,
        ROUND(SUM(amount), 2) as categoryTotal
      FROM expenses
      GROUP BY category
      UNION ALL
      SELECT 
        COUNT(*) as totalCount,
        SUM(amount) as totalAmount,
        'TOTAL' as category,
        ROUND(SUM(amount), 2) as categoryTotal
      FROM expenses
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(new Error(`Failed to get summary: ${err.message}`));
      } else {
        resolve(rows || []);
      }
    });
  });
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  db,
  initializeDatabase,
  getAllExpenses,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
};
