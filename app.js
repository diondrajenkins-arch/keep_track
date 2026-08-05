
// ── STATE ──
let entries = JSON.parse(localStorage.getItem('kt_entries')) || ;
let payConfig = JSON.parse(localStorage.getItem('kt_pay')) || null;
let notifConfig = JSON.parse(localStorage.getItem('kt_notif')) || { enabled: false, billDays: 3, payDays: 1 };
let calMonth = new Date.getMonth;
let calYear = new Date.getFullYear;

// ── NAV ──
function showSection(id) {
 document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
 document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
 document.getElementById(id).classList.add('active');
 event.target.classList.add('active');
 if (id === 'calendar') renderCalendar;
 if (id === 'dashboard') updateDashboard;
 if (id === 'notifications') renderReminders;
}

// ── FORM TOGGLES ──
function toggleBillDate {
 const type = document.getElementById('entry-type').value;
 document.getElementById('bill-due-group').style.display = type === 'bills' ? 'flex' : 'none';
 document.getElementById('bill-recurring-group').style.display = type === 'bills' ? 'flex' : 'none';
 document.getElementById('custom-category-group').style.display = type === 'custom' ? 'flex' : 'none';
}

// ── ADD ENTRY ──
function addEntry {
 const type = document.getElementById('entry-type').value;
 const desc = document.getElementById('entry-desc').value.trim;
 const amount = parseFloat(document.getElementById('entry-amount').value);
 const date = document.getElementById('entry-date').value;
 const customCat = document.getElementById('custom-category').value.trim;
 const billDueDay = parseInt(document.getElementById('bill-due-day').value) || null;
 const billRecurring = document.getElementById('bill-recurring').value;

 if (!desc || isNaN(amount) || !date) {
 alert('Please fill in description, amount, and date.');
 return;
 }

 const entry = {
 id: Date.now,
 type,
 desc,
 amount,
 date,
 customCat: type === 'custom' ? customCat : '',
 billDueDay: type === 'bills' ? billDueDay : null,
 billRecurring: type === 'bills' ? billRecurring : 'no'
 };

 entries.push(entry);
 saveEntries;
 renderLog;
 updateDashboard;
 clearForm;
}

function clearForm {
 document.getElementById('entry-desc').value = '';
 document.getElementById('entry-amount').value = '';
 document.getElementById('entry-date').value = '';
 document.getElementById('custom-category').value = '';
 document.getElementById('bill-due-day').value = '';
 document.getElementById('entry-type').value = 'income';
 toggleBillDate;
}

function saveEntries {
 localStorage.setItem('kt_entries', JSON.stringify(entries));
}

// ── DELETE ENTRY ──
function deleteEntry(id) {
 entries = entries.filter(e => e.id !== id);
 saveEntries;
 renderLog;
 updateDashboard;
}

// ── RENDER LOG ──
function renderLog {
 const filter = document.getElementById('filter-category').value;
 const tbody = document.getElementById('log-body');
 let filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

 if (filtered.length === 0) {
 tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No entries yet.</td></tr>';
 return;
 }

 filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

 tbody.innerHTML = filtered.map(e => {
 const isIncome = e.type === 'income';
 const label = e.type === 'custom' ? (e.customCat || 'Custom') : e.type;
 const dueDisplay = e.billDueDay ? `${e.billDueDay}${ordinal(e.billDueDay)}` : '-';
 return `
 <tr>
 <td>${formatDate(e.date)}</td>
 <td>${e.desc}</td>
 <td><span class="category-badge ${e.type}">${label}</span></td>
 <td>${dueDisplay}</td>
 <td class="${isIncome ? 'amount-income' : 'amount-expense'}">
 ${isIncome ? '+' : '-'}$${e.amount.toFixed(2)}
 </td>
 <td><button class="btn-delete" onclick="deleteEntry(${e.id})">Delete</button></td>
 </tr>
 `;
 }).join('');
}

// ── DASHBOARD ──
function updateDashboard {
 const income = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
 const expenses = entries.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
 const balance = income - expenses;

 document.getElementById('total-income').textContent = `$${income.toFixed(2)}`;
 document.getElementById('total-expenses').textContent = `$${expenses.toFixed(2)}`;

 const balEl = document.getElementById('balance');
 balEl.textContent = `$${Math.abs(balance).toFixed(2)}`;
 balEl.className = 'card-amount ' + (balance >= 0 ? 'positive' : 'negative');
 if (balance < 0) balEl.textContent = `-$${Math.abs(balance).toFixed(2)}`;

 renderUpcoming;
}

function renderUpcoming {
