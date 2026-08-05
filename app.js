// ── STATE ──
let entries = JSON.parse(localStorage.getItem('kt_entries')) || [];
let payConfig = JSON.parse(localStorage.getItem('kt_pay')) || null;
let notifConfig = JSON.parse(localStorage.getItem('kt_notif')) || { enabled: false, billDays: 3, payDays: 1 };
let calMonth = new Date.getMonth;
let calYear = new Date.getFullYear;

// ── NAV ──
function showSection(id) {
 document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
 document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
 document.getElementById(id).classList.add('active');
 event.currentTarget.classList.add('active');
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
 document.getElementById('bill-due-group').style.display = 'none';
 document.getElementById('bill-recurring-group').style.display = 'none';
 document.getElementById('custom-category-group').style.display = 'none';
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
 balEl.className = 'card-amount ' + (balance >= 0 ? 'positive' : 'negative');
 balEl.textContent = balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : `$${balance.toFixed(2)}`;

 renderUpcoming;
}

// ── UPCOMING ──
function renderUpcoming {
 const list = document.getElementById('upcoming-list');
 const today = new Date;
 const items = [];

 entries.filter(e => e.type === 'bills' && e.billDueDay).forEach(e => {
 const dueDate = new Date(today.getFullYear, today.getMonth, e.billDueDay);
 if (dueDate < today) dueDate.setMonth(dueDate.getMonth + 1);
 const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
 if (diff <= 7 && diff >= 0) {
 items.push({
 label: `${e.desc} - $${e.amount.toFixed(2)} due in ${diff} day${diff !== 1 ? 's' : ''}`,
 type: 'bill'
 });
 }
 });

 if (payConfig) {
 getPayDatesThisMonth.forEach(pd => {
 const diff = Math.ceil((pd - today) / (1000 * 60 * 60 * 24));
 if (diff <= 7 && diff >= 0) {
 items.push({
 label: `Pay Day in ${diff} day${diff !== 1 ? 's' : ''}`,
 type: 'pay'
 });
 }
 });
 }

 if (items.length === 0) {
 list.innerHTML = '<li class="empty-msg">Nothing due this week.</li>';
 return;
 }

 list.innerHTML = items.map(item =>
 `<li class="${item.type === 'pay' ? 'pay-item' : 'bill-item'}">${item.label}</li>`
 ).join('');
}

// ── PAY DATE ──
function savePayDate {
 const day = parseInt(document.getElementById('pay-day').value);
 const freq = document.getElementById('pay-frequency').value;
 const biweeklyStart = document.getElementById('biweekly-start').value;

 if (!day && freq !== 'biweekly') {
 alert('Please enter your pay day.');
 return;
 }

 payConfig = { day, freq, biweeklyStart };
 localStorage.setItem('kt_pay', JSON.stringify(payConfig));
 document.getElementById('pay-saved-msg').textContent = 'Pay date saved!';
 setTimeout( => document.getElementById('pay-saved-msg').textContent = '', 3000);
 renderCalendar;
}

function getPayDatesThisMonth {
 if (!payConfig) return [];
 const year = calYear;
 const month = calMonth;
 const dates = [];

 if (payConfig.freq === 'monthly') {
 dates.push(new Date(year, month, payConfig.day));
 } else if (payConfig.freq === 'biweekly' && payConfig.biweeklyStart) {
 let d = new Date(payConfig.biweeklyStart);
 while (d.getFullYear < year || (d.getFullYear === year && d.getMonth < month)) {
 d.setDate(d.getDate + 14);
 }
 while (d.getMonth === month && d.getFullYear === year) {
 dates.push(new Date(d));
 d.setDate(d.getDate + 14);
 }
 } else if (payConfig.freq === 'weekly') {
 for (let day = 1; day <= 31; day++) {
 const d = new Date(year, month, day);
 if (d.getMonth !== month) break;
 if (d.getDay === (payConfig.day % 7)) dates.push(d);
 }
 }

 return dates;
}

// ── CALENDAR ──
function changeMonth(dir) {
 calMonth += dir;
 if (calMonth > 11) { calMonth = 0; calYear++; }
 if (calMonth < 0) { calMonth = 11; calYear--; }
 renderCalendar;
}

function renderCalendar {
 const grid = document.getElementById('cal-grid');
 const label = document.getElementById('cal-month-label');
 const monthNames = ['January','February','March','April','May','June',
 'July','August','September','October','November','December'];

 label.textContent = `${monthNames[calMonth]} ${calYear}`;

 const firstDay = new Date(calYear, calMonth, 1).getDay;
 const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate;
 const today = new Date;

 const payDates = getPayDatesThisMonth.map(d => d.getDate);
 const billDays = entries
 .filter(e => e.type === 'bills' && e.billDueDay)
 .map(e => e.billDueDay);

 const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 let html = dayHeaders.map(d => `<div class="cal-day-header">${d}</div>`).join('');

 for (let i = 0; i < firstDay; i++) {
 html += `<div class="cal-day empty"></div>`;
 }

 for (let day = 1; day <= daysInMonth; day++) {
 const isToday = day === today.getDate && calMonth === today.getMonth && calYear === today.getFullYear;
 const isPay = payDates.includes(day);
 const isBill = billDays.includes(day);

 let classes = 'cal-day';
 if (isToday) classes += ' today';
 else if (isPay && isBill) classes += ' pay-day bill-day';
 else if (isPay) classes += ' pay-day';
 else if (isBill) classes += ' bill-day';

 const dots = [
 isPay ? `<span class="cal-dot green"></span>` : '',
 isBill ? `<span class="cal-dot red"></span>` : ''
 ].join('');

 html += `<div class="${classes}"><span>${day}</span>${dots}</div>`;
 }

 grid.innerHTML = html;
}

// ── NOTIFICATIONS ──
document.addEventListener('DOMContentLoaded',  => {
 const notifToggle = document.getElementById('notif-enabled');
 if (notifToggle) {
 notifToggle.addEventListener('change', function {
 document.getElementById('notif-settings').style.display = this.checked ? 'block' : 'none';
 if (this.checked) Notification.requestPermission;
 });
 }

 const payFreq = document.getElementById('pay-frequency');
 if (payFreq) {
 payFreq.addEventListener('change', function {
 document.getElementById('biweekly-start-group').style.display = this.value === 'biweekly' ? 'flex' : 'none';
 });
 }

 const entryType = document.getElementById('entry-type');
 if (entryType) {
 entryType.addEventListener('change', toggleBillDate);
 }

 renderLog;
 updateDashboard;
 renderCalendar;

 if (notifConfig.enabled) {
 document.getElementById('notif-enabled').checked = true;
 document.getElementById('notif-settings').style.display = 'block';
 document.getElementById('bill-reminder-days').value = notifConfig.billDays;
 document.getElementById('pay-reminder-days').value = notifConfig.payDays;
 scheduleNotifications;
 }

 if (payConfig) {
 document.getElementById('pay-day').value = payConfig.day || '';
 document.getElementById('pay-frequency').value = payConfig.freq || 'monthly';
 if (payConfig.freq === 'biweekly') {
 document.getElementById('biweekly-start-group').style.display = 'flex';
 document.getElementById('biweekly-start').value = payConfig.biweeklyStart || '';
 }
 }
});

function saveNotifSettings {
 notifConfig = {
 enabled: document.getElementById('notif-enabled').checked,
 billDays: parseInt(document.getElementById('bill-reminder-days').value) || 3,
 payDays: parseInt(document.getElementById('pay-reminder-days').value) || 1
 };
 localStorage.setItem('kt_notif', JSON.stringify(notifConfig));
 document.getElementById('notif-saved-msg').textContent = 'Notification settings saved!';
 setTimeout( => document.getElementById('notif-saved-msg').textContent = '', 3000);
 scheduleNotifications;
 renderReminders;
}

function scheduleNotifications {
 if (!notifConfig.enabled || Notification.permission !== 'granted') return;

 const today = new Date;

 entries.filter(e => e.type === 'bills' && e.billDueDay).forEach(e => {
 const dueDate = new Date(today.getFullYear, today.getMonth, e.billDueDay);
 if (dueDate < today) dueDate.setMonth(dueDate.getMonth + 1);
 const reminderDate = new Date(dueDate);
 reminderDate.setDate(reminderDate.getDate - notifConfig.billDays);
 const msUntil = reminderDate - today;
 if (msUntil > 0) {
 setTimeout( => {
 new Notification('Keep Track - Bill Reminder', {
 body: `${e.desc} ($${e.amount.toFixed(2)}) is due in ${notifConfig.billDays} days.`
 });
 }, msUntil);
 }
 });

 if (payConfig) {
 getPayDatesThisMonth.forEach(pd => {
 const reminderDate = new Date(pd);
 reminderDate.setDate(reminderDate.getDate - notifConfig.payDays);
 const msUntil = reminderDate - today;
 if (msUntil > 0) {
 setTimeout( => {
 new Notification('Keep Track - Pay Day Coming', {
 body: `Your pay day arrives in ${notifConfig.payDays} day${notifConfig.payDays !== 1 ? 's' : ''}.`
 });
 }, msUntil);
 }
 });
 }
}

// ── RENDER REMINDERS ──
function renderReminders {
 const list = document.getElementById('reminder-list');
 const today = new Date;
 const items = [];

 entries.filter(e => e.type === 'bills' && e.billDueDay).forEach(e => {
 const dueDate = new Date(today.getFullYear, today.getMonth, e.billDueDay);
 if (dueDate < today) dueDate.setMonth(dueDate.getMonth + 1);
 const reminderDate = new Date(dueDate);
 reminderDate.setDate(reminderDate.getDate - notifConfig.billDays);
 items.push({
 label: `${e.desc} - reminder on ${formatDate(reminderDate.toISOString.split('T')[0])} (${notifConfig.billDays} days before due)`,
 type: 'bill'
 });
 });

 if (payConfig) {
 getPayDatesThisMonth.forEach(pd => {
 const reminderDate = new Date(pd);
 reminderDate.setDate(reminderDate.getDate - notifConfig.payDays);
 items.push({
 label: `Pay Day reminder on ${formatDate(reminderDate.toISOString.split('T')[0])}`,
 type: 'pay'
 });
 });
 }

 if (items.length === 0) {
 list.innerHTML = '<li class="empty-msg">No reminders scheduled.</li>';
 return;
 }

 list.innerHTML = items.map(item =>
 `<li class="${item.type === 'pay' ? 'pay-item' : 'bill-item'}">${item.label}</li>`
 ).join('');
}

// ── HELPERS ──
function formatDate(dateStr) {
 const [y, m, d] = dateStr.split('-');
 const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function ordinal(n) {
 if (n > 3 && n < 21) return 'th';
 switch (n % 10) {
 case 1: return 'st';
 case 2: return 'nd';
 case 3: return 'rd';
 default: return 'th';
 }
}
