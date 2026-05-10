const app = document.querySelector('.app');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const themeToggle = document.getElementById('themeToggle');
const themeToggleSettings = document.getElementById('themeToggleSettings');
const currencySelect = document.getElementById('currencySelect');
const currencySelectSettings = document.getElementById('currencySelectSettings');
const exportCsvBtn = document.getElementById('exportCsv');
const downloadReportBtn = document.getElementById('downloadReport');
const reminderBtn = document.getElementById('reminderBtn');
const budgetInput = document.getElementById('budgetInput');
const budgetStatus = document.getElementById('budgetStatus');
const openModalBtn = document.getElementById('openModal');
const fabButton = document.getElementById('fabButton');
const transactionModal = document.getElementById('transactionModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelEditBtn = document.getElementById('cancelEdit');
const transactionForm = document.getElementById('transactionForm');
const typeInput = document.getElementById('typeInput');
const amountInput = document.getElementById('amountInput');
const categoryInput = document.getElementById('categoryInput');
const dateInput = document.getElementById('dateInput');
const noteInput = document.getElementById('noteInput');
const transactionsList = document.getElementById('transactionsList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const categoryFilter = document.getElementById('categoryFilter');
const dateFilter = document.getElementById('dateFilter');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const toast = document.getElementById('toast');
const monthlyBar = document.getElementById('monthlyBar');
const categoryPie = document.getElementById('categoryPie');
const monthlyBarLarge = document.getElementById('monthlyBarLarge');
const categoryPieLarge = document.getElementById('categoryPieLarge');

const defaultCategories = [
  'Food',
  'Shopping',
  'Bills',
  'Travel',
  'Entertainment',
  'Health',
  'Salary',
  'Other'
];

const state = {
  transactions: [],
  currency: 'USD',
  theme: 'light',
  budget: 0,
  editingId: null
};

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥'
};

const storageKeys = {
  transactions: 'fintrack_transactions',
  theme: 'fintrack_theme',
  currency: 'fintrack_currency',
  budget: 'fintrack_budget'
};

const formatCurrency = (value) => {
  const symbol = currencySymbols[state.currency] || '$';
  return `${symbol}${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
};

const saveState = () => {
  localStorage.setItem(storageKeys.transactions, JSON.stringify(state.transactions));
  localStorage.setItem(storageKeys.theme, state.theme);
  localStorage.setItem(storageKeys.currency, state.currency);
  localStorage.setItem(storageKeys.budget, state.budget);
};

const loadState = () => {
  state.transactions = JSON.parse(localStorage.getItem(storageKeys.transactions) || '[]');
  state.theme = localStorage.getItem(storageKeys.theme) || 'light';
  state.currency = localStorage.getItem(storageKeys.currency) || 'USD';
  state.budget = Number(localStorage.getItem(storageKeys.budget) || 0);
};

const updateTheme = () => {
  document.body.setAttribute('data-theme', state.theme);
  app.setAttribute('data-theme', state.theme);
  themeToggle.textContent = state.theme === 'light' ? '🌙' : '☀️';
};

const setupCategories = () => {
  const options = defaultCategories.map(
    (category) => `<option value="${category}">${category}</option>`
  );
  categoryInput.innerHTML = options.join('');
  categoryFilter.innerHTML = `<option value="all">All Categories</option>${options.join('')}`;
};

const animateCounter = (element, value) => {
  const start = 0;
  const duration = 600;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const current = start + (value - start) * progress;
    element.textContent = formatCurrency(current);
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const updateSummary = () => {
  const income = state.transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = state.transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const balance = income - expense;

  animateCounter(totalIncome, income);
  animateCounter(totalExpense, expense);
  animateCounter(totalBalance, balance);

  const budget = state.budget || 0;
  if (budget > 0 && expense > budget) {
    budgetStatus.textContent = `⚠️ Budget limit exceeded by ${formatCurrency(expense - budget)}`;
    budgetStatus.style.color = 'var(--danger)';
    budgetStatus.style.background = 'rgba(239, 68, 68, 0.1)';
    showToast('Budget limit exceeded!');
  } else if (budget > 0) {
    budgetStatus.textContent = `✅ You have ${formatCurrency(budget - expense)} remaining this month.`;
    budgetStatus.style.color = 'var(--success)';
    budgetStatus.style.background = 'rgba(34, 197, 94, 0.1)';
  } else {
    budgetStatus.textContent = 'Set a budget to track your spending goals.';
    budgetStatus.style.color = 'var(--muted)';
    budgetStatus.style.background = 'rgba(148, 163, 184, 0.1)';
  }

  renderCharts();
};

const getMonthlyTotals = () => {
  const totals = Array.from({ length: 12 }, () => 0);
  state.transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const month = new Date(tx.date).getMonth();
      totals[month] += tx.amount;
    });
  return totals;
};

const getCategoryTotals = () => {
  const totals = {};
  defaultCategories.forEach((category) => {
    totals[category] = 0;
  });
  state.transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });
  return totals;
};

const renderCharts = () => {
  renderBarChart(monthlyBar, getMonthlyTotals());
  renderBarChart(monthlyBarLarge, getMonthlyTotals());
  renderPieChart(categoryPie, getCategoryTotals());
  renderPieChart(categoryPieLarge, getCategoryTotals());
};

const renderBarChart = (canvas, data) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.parentElement.clientWidth - 20;
  const height = canvas.height = 200;
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(...data, 1);
  const barWidth = width / data.length - 6;
  data.forEach((value, index) => {
    const x = index * (barWidth + 6);
    const barHeight = (value / max) * (height - 20);
    ctx.fillStyle = 'rgba(99,102,241,0.7)';
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
  });
};

const renderPieChart = (canvas, data) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.parentElement.clientWidth - 20;
  const height = canvas.height = 200;
  ctx.clearRect(0, 0, width, height);

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  let startAngle = 0;
  const colors = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#14b8a6', '#ef4444', '#0ea5e9', '#a855f7'];

  Object.values(data).forEach((value, index) => {
    const sliceAngle = total ? (value / total) * Math.PI * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.arc(width / 2, height / 2, 80, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    startAngle += sliceAngle;
  });
};

const openModal = () => {
  transactionModal.classList.add('active');
};

const closeModal = () => {
  transactionModal.classList.remove('active');
  transactionForm.reset();
  state.editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Transaction';
};

const addTransaction = (transaction) => {
  state.transactions.unshift(transaction);
  saveState();
  renderTransactions();
  updateSummary();
};

const updateTransaction = (transaction) => {
  state.transactions = state.transactions.map((tx) => (tx.id === transaction.id ? transaction : tx));
  saveState();
  renderTransactions();
  updateSummary();
};

const deleteTransaction = (id) => {
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  saveState();
  renderTransactions();
  updateSummary();
  showToast('Transaction deleted');
};

const renderTransactions = () => {
  const search = searchInput.value.toLowerCase();
  const type = typeFilter.value;
  const category = categoryFilter.value;
  const date = dateFilter.value;

  const filtered = state.transactions.filter((tx) => {
    const matchesSearch =
      tx.note.toLowerCase().includes(search) || tx.category.toLowerCase().includes(search);
    const matchesType = type === 'all' || tx.type === type;
    const matchesCategory = category === 'all' || tx.category === category;
    const matchesDate = !date || tx.date === date;
    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  transactionsList.innerHTML = filtered
    .map(
      (tx) => `
      <div class="transaction-item">
        <div class="transaction-meta">
          <div>
            <strong>${tx.category}</strong>
            <p class="subtitle">${tx.note || 'No description'}</p>
          </div>
          <span class="tag">${tx.date}</span>
        </div>
        <div class="transaction-meta">
          <span class="amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</span>
          <div class="actions">
            <button class="icon-btn" data-edit="${tx.id}">✏️</button>
            <button class="icon-btn" data-delete="${tx.id}">🗑️</button>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  emptyState.style.display = filtered.length ? 'none' : 'block';
};

const handleEdit = (id) => {
  const transaction = state.transactions.find((tx) => tx.id === id);
  if (!transaction) return;
  state.editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Transaction';
  typeInput.value = transaction.type;
  amountInput.value = transaction.amount;
  categoryInput.value = transaction.category;
  dateInput.value = transaction.date;
  noteInput.value = transaction.note;
  openModal();
};

const handleSubmit = (event) => {
  event.preventDefault();
  if (!amountInput.value || !dateInput.value || !categoryInput.value) {
    showToast('Please fill all required fields');
    return;
  }

  const transaction = {
    id: state.editingId || Date.now().toString(),
    type: typeInput.value,
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    note: noteInput.value.trim()
  };

  if (state.editingId) {
    updateTransaction(transaction);
    showToast('Transaction updated');
  } else {
    addTransaction(transaction);
    showToast('Transaction added');
  }
  closeModal();
};

const exportCsv = () => {
  if (!state.transactions.length) {
    showToast('No transactions to export');
    return;
  }

  const headers = ['Type', 'Amount', 'Category', 'Date', 'Notes'];
  const rows = state.transactions.map((tx) => [
    tx.type,
    tx.amount,
    tx.category,
    tx.date,
    tx.note
  ]);
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fintrack-transactions.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const downloadReport = () => {
  const reportContent = `FinTrack Expense Report\n\nTotal Balance: ${totalBalance.textContent}\nTotal Income: ${totalIncome.textContent}\nTotal Expense: ${totalExpense.textContent}\n\nTransactions:\n${state.transactions
    .map((tx) => `${tx.date} | ${tx.type} | ${tx.category} | ${formatCurrency(tx.amount)} | ${tx.note}`)
    .join('\n')}`;

  const blob = new Blob([reportContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fintrack-report.txt';
  link.click();
  URL.revokeObjectURL(url);
};

const setupCurrencySelectors = () => {
  const options = Object.keys(currencySymbols)
    .map((code) => `<option value="${code}">${code} (${currencySymbols[code]})</option>`)
    .join('');
  currencySelectSettings.innerHTML = options;
  currencySelect.value = state.currency;
  currencySelectSettings.value = state.currency;
};

const resetData = () => {
  if (!confirm('Are you sure you want to reset all data?')) return;
  localStorage.clear();
  loadState();
  setupUI();
  showToast('All data reset');
};

const setupUI = () => {
  updateTheme();
  setupCategories();
  setupCurrencySelectors();
  budgetInput.value = state.budget || '';
  renderTransactions();
  updateSummary();
};

const handleNavigation = (target) => {
  navLinks.forEach((link) => link.classList.remove('active'));
  sections.forEach((section) => section.classList.remove('active'));
  document.querySelector(`[data-target="${target}"]`).classList.add('active');
  document.getElementById(target).classList.add('active');
};

navLinks.forEach((link) => {
  link.addEventListener('click', () => handleNavigation(link.dataset.target));
});

openModalBtn.addEventListener('click', openModal);
fabButton.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelEditBtn.addEventListener('click', closeModal);
transactionForm.addEventListener('submit', handleSubmit);

transactionsList.addEventListener('click', (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) handleEdit(editId);
  if (deleteId) deleteTransaction(deleteId);
});

[searchInput, typeFilter, categoryFilter, dateFilter].forEach((input) =>
  input.addEventListener('input', renderTransactions)
);

currencySelect.addEventListener('change', (event) => {
  state.currency = event.target.value;
  currencySelectSettings.value = state.currency;
  saveState();
  updateSummary();
  renderTransactions();
});

currencySelectSettings.addEventListener('change', (event) => {
  state.currency = event.target.value;
  currencySelect.value = state.currency;
  saveState();
  updateSummary();
  renderTransactions();
});

[themeToggle, themeToggleSettings].forEach((btn) => {
  btn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    saveState();
    updateTheme();
  });
});

budgetInput.addEventListener('input', (event) => {
  state.budget = Number(event.target.value || 0);
  saveState();
  updateSummary();
});

exportCsvBtn.addEventListener('click', exportCsv);
downloadReportBtn.addEventListener('click', downloadReport);
reminderBtn.addEventListener('click', () => showToast('Reminder UI enabled')); 

window.addEventListener('resize', renderCharts);

loadState();
setupUI();
