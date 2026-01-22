/**
 * MAIN APPLICATION CONTROLLER
 * Orchestrates the app: API calls, state management, event handling
 */

// ============================================================
// APPLICATION STATE
// ============================================================

let appState = {
  expenses: [],
  isLoading: false
};

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize app on page load
 */
async function initializeApp() {
  console.log('🚀 Initializing Expense Tracker...');

  try {
    // Set today's date as default
    elements.dateInput.value = getTodayDate();

    // Load expenses
    await loadExpenses();

    // Attach event listeners
    setupEventListeners();

    // Setup responsive listening
    setupResponsiveListener(appState.expenses);

    console.log('✅ App initialized successfully');
  } catch (error) {
    logError('Failed to initialize app', error);
    showError('Failed to load app. Please refresh the page.');
  }
}

// ============================================================
// LOAD EXPENSES
// ============================================================

/**
 * Fetch and display all expenses
 */
async function loadExpenses() {
  try {
    showLoading();
    const expenses = await getExpenses();
    
    appState.expenses = sortByDateDesc(expenses);
    renderExpenseList(appState.expenses);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showError('Could not load expenses. Check your connection.');
    console.error(error);
  }
}

// ============================================================
// FORM SUBMISSION
// ============================================================

/**
 * Handle form submission (add expense)
 */
async function onFormSubmit(e) {
  e.preventDefault();
  clearMessages();

  // Get form data
  const formData = getFormData();

  // Validate client-side first
  const validationError = validateExpenseForm(formData);
  if (validationError) {
    showError(validationError);
    return;
  }

  // Show loading state
  setFormLoading(true);

  try {
    // Send to backend
    const newExpense = await addExpense(formData);

    // Update state
    appState.expenses.unshift(newExpense);

    // Update UI
    renderExpenseList(appState.expenses);
    clearForm();
    showSuccess('✅ Expense added successfully!');

  } catch (error) {
    // Handle specific error codes
    if (error.code === 'VALIDATION_ERROR') {
      const errorMessages = error.details?.errors
        ?.map(e => e.message)
        .join(', ');
      showError(errorMessages || 'Validation failed');
    } else {
      showError(error.message || 'Failed to add expense');
    }
  } finally {
    setFormLoading(false);
  }
}

// ============================================================
// DELETE EXPENSE
// ============================================================

/**
 * Delete expense by ID
 * @param {number} id
 */
async function onDeleteExpense(id) {
  try {
    await deleteExpense(id);

    // Update state
    appState.expenses = appState.expenses.filter(e => e.id !== id);

    // Update UI
    renderExpenseList(appState.expenses);
    showSuccess('Expense deleted successfully');

  } catch (error) {
    showError(error.message || 'Failed to delete expense');
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Form submission
  elements.form.addEventListener('submit', onFormSubmit);

  // Real-time validation (optional - improves UX)
  elements.amountInput.addEventListener('blur', () => {
    const error = validateField('amount', elements.amountInput.value);
    if (error) {
      showError(error);
    }
  });

  elements.dateInput.addEventListener('blur', () => {
    const error = validateField('date', elements.dateInput.value);
    if (error) {
      showError(error);
    }
  });

  elements.categorySelect.addEventListener('change', () => {
    const error = validateField('category', elements.categorySelect.value);
    if (error) {
      showError(error);
    }
  });
}

// ============================================================
// APP STARTUP
// ============================================================

// Start app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
