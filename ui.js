/**
 * UI MANAGEMENT LAYER
 * Handles DOM manipulation and updates
 */

// ============================================================
// CACHE DOM ELEMENTS (Select once, reuse)
// ============================================================

const elements = {
  form: document.getElementById('expenseForm'),
  dateInput: document.getElementById('expenseDate'),
  amountInput: document.getElementById('expenseAmount'),
  categorySelect: document.getElementById('expenseCategory'),
  descriptionInput: document.getElementById('expenseDescription'),
  submitBtn: document.querySelector('.btn-primary'),
  
  messageContainer: document.getElementById('messageContainer'),
  expenseList: document.getElementById('expenseList'),
  totalAmount: document.getElementById('totalAmount'),
  emptyState: document.getElementById('emptyState'),
  loadingSpinner: document.getElementById('loadingSpinner')
};

// ============================================================
// MESSAGE DISPLAY
// ============================================================

/**
 * Show error message
 * @param {string} message
 * @param {number} duration - Auto-hide in ms (null = no auto-hide)
 */
function showError(message, duration = 5000) {
  showMessage(message, 'error', duration);
}

/**
 * Show success message
 * @param {string} message
 * @param {number} duration
 */
function showSuccess(message, duration = 4000) {
  showMessage(message, 'success', duration);
}

/**
 * Show info message
 * @param {string} message
 * @param {number} duration
 */
function showInfo(message, duration = 4000) {
  showMessage(message, 'info', duration);
}

/**
 * Generic message display
 * @param {string} message
 * @param {string} type - 'error', 'success', or 'info'
 * @param {number} duration - Auto-hide after ms
 */
function showMessage(message, type = 'info', duration = 5000) {
  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="alert-close" aria-label="Close">×</button>
  `;

  // Add to DOM
  elements.messageContainer.appendChild(alert);

  // Close button handler
  alert.querySelector('.alert-close').addEventListener('click', () => {
    alert.remove();
  });

  // Auto-hide
  if (duration) {
    setTimeout(() => {
      alert.remove();
    }, duration);
  }
}

/**
 * Clear all messages
 */
function clearMessages() {
  elements.messageContainer.innerHTML = '';
}

// ============================================================
// FORM MANAGEMENT
// ============================================================

/**
 * Get form data as object
 * @returns {Object} { date, amount, category, description }
 */
function getFormData() {
  return {
    date: elements.dateInput.value,
    amount: elements.amountInput.value,
    category: elements.categorySelect.value,
    description: elements.descriptionInput.value
  };
}

/**
 * Clear form inputs
 */
function clearForm() {
  elements.form.reset();
  elements.dateInput.value = getTodayDate(); // Reset to today
}

/**
 * Set form data (for editing)
 * @param {Object} data
 */
function setFormData(data) {
  if (data.date) elements.dateInput.value = data.date;
  if (data.amount) elements.amountInput.value = data.amount;
  if (data.category) elements.categorySelect.value = data.category;
  if (data.description) elements.descriptionInput.value = data.description;
}

/**
 * Disable/enable form submission
 * @param {boolean} isLoading
 */
function setFormLoading(isLoading) {
  elements.submitBtn.disabled = isLoading;
  elements.submitBtn.textContent = isLoading ? '⏳ Adding...' : '➕ Add Expense';
}

// ============================================================
// EXPENSE LIST RENDERING
// ============================================================

/**
 * Render expense list based on screen size
 * @param {Array} expenses
 */
function renderExpenseList(expenses) {
  clearMessages();

  // Show/hide empty state
  if (expenses.length === 0) {
    elements.expenseList.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    elements.totalAmount.textContent = formatAmount(0);
    return;
  }

  elements.emptyState.classList.add('hidden');

  // Update total
  const total = calculateTotal(expenses);
  elements.totalAmount.textContent = formatAmount(total);

  // Check screen size for rendering style
  if (window.innerWidth >= 768) {
    renderTable(expenses);
  } else {
    renderCards(expenses);
  }
}

/**
 * Render expenses as table (desktop)
 * @param {Array} expenses
 */
function renderTable(expenses) {
  const html = `
    <table class="expense-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${expenses.map(expense => `
          <tr>
            <td>
              <span class="expense-date">${formatDate(expense.date)}</span>
            </td>
            <td>
              <span>${escapeHtml(expense.description || '—')}</span>
            </td>
            <td>
              <span class="expense-category">${escapeHtml(expense.category)}</span>
            </td>
            <td>
              <span class="expense-amount">${formatAmount(expense.amount)}</span>
            </td>
            <td>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${expense.id}">
                🗑️ Delete
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  elements.expenseList.innerHTML = html;

  // Attach delete handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      handleDeleteClick(id);
    });
  });
}

/**
 * Render expenses as cards (mobile)
 * @param {Array} expenses
 */
function renderCards(expenses) {
  const html = expenses.map(expense => `
    <div class="expense-card">
      <div class="expense-card-row">
        <span class="expense-card-label">Date</span>
        <span class="expense-card-value">${formatDate(expense.date)}</span>
      </div>
      <div class="expense-card-row">
        <span class="expense-card-label">Category</span>
        <span class="expense-category">${escapeHtml(expense.category)}</span>
      </div>
      <div class="expense-card-row">
        <span class="expense-card-label">Amount</span>
        <span class="expense-amount">${formatAmount(expense.amount)}</span>
      </div>
      ${expense.description ? `
        <div class="expense-card-row">
          <span class="expense-card-label">Notes</span>
          <span class="expense-description">${escapeHtml(expense.description)}</span>
        </div>
      ` : ''}
      <div class="expense-card-row" style="margin-top: 12px;">
        <button class="btn btn-danger btn-sm delete-btn" data-id="${expense.id}">
          🗑️ Delete
        </button>
      </div>
    </div>
  `).join('');

  elements.expenseList.innerHTML = html;

  // Attach delete handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      handleDeleteClick(id);
    });
  });
}

// ============================================================
// DELETE CONFIRMATION
// ============================================================

/**
 * Handle delete button click with confirmation
 * @param {number} id
 */
function handleDeleteClick(id) {
  if (confirm('Are you sure you want to delete this expense?')) {
    onDeleteExpense(id);
  }
}

// ============================================================
// LOADING STATES
// ============================================================

/**
 * Show loading spinner
 */
function showLoading() {
  elements.loadingSpinner.classList.remove('hidden');
  elements.expenseList.innerHTML = '';
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  elements.loadingSpinner.classList.add('hidden');
}

// ============================================================
// RESPONSIVE UPDATES
// ============================================================

/**
 * Re-render on window resize (responsive)
 */
function setupResponsiveListener(expenses) {
  window.addEventListener('resize', () => {
    renderExpenseList(expenses);
  });
}
