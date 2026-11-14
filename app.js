(() => {
  'use strict';
  const TASKS_KEY = 'daymark.tasks.v1';
  const EXPENSES_KEY = 'daymark.expenses.v1';
  const CURRENCY = 'USD';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const read = (key) => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { window.alert('Your browser could not save this change. Check that local storage is available.'); } };
  let tasks = read(TASKS_KEY);
  let expenses = read(EXPENSES_KEY);
  let editingTaskId = null;
  let editingExpenseId = null;
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY });
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const formatDate = (value) => { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date); };
  $('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  $('#currency-symbol').textContent = (new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).formatToParts(0).find((part) => part.type === 'currency') || {}).value || '$';

  function renderTasks() {
    const query = $('#task-search').value.trim().toLowerCase();
    const filter = $('#task-filter').value;
    const visible = tasks.filter((task) => (filter === 'all' || (filter === 'active' ? !task.completed : task.completed)) && `${task.title} ${task.notes || ''}`.toLowerCase().includes(query));
    $('#task-total').textContent = tasks.length;
    $('#task-completed').textContent = tasks.filter((task) => task.completed).length;
    $('#task-open').textContent = tasks.filter((task) => !task.completed).length;
    $('#task-heading-count').textContent = visible.length;
    $('#nav-task-count').textContent = tasks.filter((task) => !task.completed).length;
    const list = $('#task-list');
    if (!visible.length) {
      const searching = query || filter !== 'all';
      list.innerHTML = `<div class="empty-state"><div class="empty-illustration">☷</div><h3>${searching ? 'No matching tasks' : 'Your list is clear'}</h3><p>${searching ? 'Try a different search or filter.' : 'Add a task to give your day a little direction.'}</p>${searching ? '' : '<button class="text-button" data-action="new-task">＋ Add your first task</button>'}</div>`;
      return;
    }
    list.innerHTML = visible.map((task) => `<article class="task-row ${task.completed ? 'completed' : ''}" data-id="${escapeHTML(task.id)}"><button class="task-check" data-action="toggle-task" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">${task.completed ? '✓' : ''}</button><div class="task-copy"><span class="task-title">${escapeHTML(task.title)}</span>${task.notes ? `<div class="task-notes">${escapeHTML(task.notes)}</div>` : ''}</div><span class="priority ${escapeHTML(task.priority || 'normal')}">${escapeHTML(task.priority || 'normal')}</span><span class="task-date">${formatDate(task.createdAt)}</span><div class="row-actions"><button class="icon-button" data-action="edit-task" aria-label="Edit task">✎</button><button class="icon-button" data-action="delete-task" aria-label="Delete task">×</button></div></article>`).join('');
  }

  function renderExpenses() {
    const query = $('#expense-search').value.trim().toLowerCase();
    const filter = $('#expense-filter').value;
    const visible = expenses.filter((expense) => (filter === 'all' || expense.category === filter) && `${expense.title} ${expense.category}`.toLowerCase().includes(query));
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const byCategory = expenses.reduce((result, expense) => { result[expense.category] = (result[expense.category] || 0) + Number(expense.amount || 0); return result; }, {});
    $('#expense-total').textContent = money.format(total);
    $('#expense-count').textContent = expenses.length;
    $('#expense-top-category').textContent = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    $('#expense-heading-count').textContent = visible.length;
    $('#nav-expense-count').textContent = expenses.length;
    const tbody = $('#expense-list');
    const empty = $('#expense-empty');
    if (!visible.length) { tbody.innerHTML = ''; empty.hidden = false; empty.querySelector('h3').textContent = query || filter !== 'all' ? 'No matching expenses' : 'No expenses yet'; empty.querySelector('p').textContent = query || filter !== 'all' ? 'Try a different search or category.' : 'Start tracking your spending by adding your first expense.'; empty.querySelector('[data-action]').hidden = Boolean(query || filter !== 'all'); return; }
    empty.hidden = true;
    tbody.innerHTML = visible.map((expense) => `<tr class="expense-row" data-id="${escapeHTML(expense.id)}"><td class="expense-description">${escapeHTML(expense.title)}</td><td><span class="category-tag"><span class="category-dot"></span>${escapeHTML(expense.category)}</span></td><td>${formatDate(expense.date)}</td><td class="amount-cell">${money.format(Number(expense.amount))}</td><td><div class="row-actions"><button class="icon-button" data-action="edit-expense" aria-label="Edit expense">✎</button><button class="icon-button" data-action="delete-expense" aria-label="Delete expense">×</button></div></td></tr>`).join('');
  }
  function persistTasks() { save(TASKS_KEY, tasks); renderTasks(); }
  function persistExpenses() { save(EXPENSES_KEY, expenses); renderExpenses(); }
  function clearErrors(ids) { ids.forEach((id) => { $(`#${id}`).textContent = ''; }); }
  function openTask(task) {
    editingTaskId = task?.id || null;
    $('#task-dialog-title').textContent = task ? 'Edit task' : 'Add a task';
    $('#task-submit').textContent = task ? 'Save changes' : 'Add task';
    $('#task-title-input').value = task?.title || '';
    $('#task-notes-input').value = task?.notes || '';
    $('#task-priority-input').value = task?.priority || 'normal';
    clearErrors(['task-title-error']); $('#task-dialog').showModal(); $('#task-title-input').focus();
  }
  function openExpense(expense) {
    editingExpenseId = expense?.id || null;
    $('#expense-dialog-title').textContent = expense ? 'Edit expense' : 'Add an expense';
    $('#expense-submit').textContent = expense ? 'Save changes' : 'Add expense';
    $('#expense-title-input').value = expense?.title || '';
    $('#expense-amount-input').value = expense?.amount ?? '';
    $('#expense-category-input').value = expense?.category || 'Food & drink';
    $('#expense-date-input').value = expense?.date || new Date().toISOString().slice(0, 10);
    clearErrors(['expense-title-error', 'expense-amount-error', 'expense-date-error']); $('#expense-dialog').showModal(); $('#expense-title-input').focus();
  }
  $('#task-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = $('#task-title-input').value.trim();
    $('#task-title-error').textContent = title ? '' : 'Please enter a task name.';
    if (!title) { $('#task-title-input').focus(); return; }
    const previous = tasks.find((task) => task.id === editingTaskId);
    const task = { id: editingTaskId || uid(), title, notes: $('#task-notes-input').value.trim(), priority: $('#task-priority-input').value, completed: previous?.completed || false, createdAt: previous?.createdAt || new Date().toISOString().slice(0, 10) };
    tasks = editingTaskId ? tasks.map((item) => item.id === editingTaskId ? task : item) : [task, ...tasks];
    persistTasks(); $('#task-dialog').close();
  });
  $('#expense-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = $('#expense-title-input').value.trim();
    const amount = Number($('#expense-amount-input').value);
    const date = $('#expense-date-input').value;
    $('#expense-title-error').textContent = title ? '' : 'Please enter a description.';
    $('#expense-amount-error').textContent = Number.isFinite(amount) && amount > 0 ? '' : 'Enter an amount greater than zero.';
    $('#expense-date-error').textContent = date && !Number.isNaN(Date.parse(`${date}T00:00:00`)) ? '' : 'Please choose a valid date.';
    if (!title || !Number.isFinite(amount) || amount <= 0 || !date || Number.isNaN(Date.parse(`${date}T00:00:00`))) { if (!title) $('#expense-title-input').focus(); else if (!(amount > 0)) $('#expense-amount-input').focus(); else $('#expense-date-input').focus(); return; }
    const expense = { id: editingExpenseId || uid(), title, amount: Math.round(amount * 100) / 100, category: $('#expense-category-input').value, date };
    expenses = editingExpenseId ? expenses.map((item) => item.id === editingExpenseId ? expense : item) : [expense, ...expenses];
    persistExpenses(); $('#expense-dialog').close();
  });
  function switchView(view) {
    const isTasks = view === 'tasks';
    $$('.view').forEach((element) => element.classList.toggle('active', element.id === `${view}-view`));
    $$('.nav-item').forEach((element) => element.classList.toggle('active', element.dataset.view === view));
    $('#crumb-current').textContent = isTasks ? 'My tasks' : 'Expenses';
  }
  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-view]');
    if (nav) { switchView(nav.dataset.view); return; }
    const close = event.target.closest('[data-close]');
    if (close) { $(`#${close.dataset.close}`).close(); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    const taskRow = actionButton.closest('.task-row');
    const expenseRow = actionButton.closest('.expense-row');
    if (action === 'new-task') { openTask(); return; }
    if (action === 'new-expense') { openExpense(); return; }
    if (taskRow) {
      const id = taskRow.dataset.id;
      if (action === 'toggle-task') tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
      if (action === 'edit-task') { openTask(tasks.find((task) => task.id === id)); return; }
      if (action === 'delete-task') tasks = tasks.filter((task) => task.id !== id);
      persistTasks(); return;
    }
    if (expenseRow) {
      const id = expenseRow.dataset.id;
      if (action === 'edit-expense') { openExpense(expenses.find((expense) => expense.id === id)); return; }
      if (action === 'delete-expense') expenses = expenses.filter((expense) => expense.id !== id);
      persistExpenses();
    }
  });
  $('#add-task-open').addEventListener('click', () => openTask());
  $('#add-expense-open').addEventListener('click', () => openExpense());
  $('#task-search').addEventListener('input', renderTasks);
  $('#task-filter').addEventListener('change', renderTasks);
  $('#expense-search').addEventListener('input', renderExpenses);
  $('#expense-filter').addEventListener('change', renderExpenses);
  [$('#task-dialog'), $('#expense-dialog')].forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
  renderTasks(); renderExpenses();
})();
