// ── STATE ──
var entries = JSON.parse(localStorage.getItem('kt_entries')) || ;
var payConfig = JSON.parse(localStorage.getItem('kt_pay')) || null;
var notifConfig = JSON.parse(localStorage.getItem('kt_notif')) || { enabled: false, billDays: 3, payDays: 1 };
var today = new Date;
var calMonth = today.getMonth;
var calYear = today.getFullYear;

// ── NAV ──
function showSection(id) {
 var sections = document.querySelectorAll('.section');
 var buttons = document.querySelectorAll('.nav-btn');
 for (var i = 0; i < sections.length; i++) {
 sections[i].classList.remove('active');
 }
 for (var j = 0; j < buttons.length; j++) {
 buttons[j].classList.remove('active');
 }
 document.getElementById(id).classList.add('active');
 var btns = document.querySelectorAll('.nav-btn');
 for (var k = 0; k < btns.length; k++) {
 if (btns[k].getAttribute('onclick') === "showSection('" + id + "')") {
 btns[k].classList.add('active');
 }
 }
 if (id === 'calendar') renderCalendar;
 if (id === 'dashboard') updateDashboard;
 if (id === 'notifications') renderReminders;
}

// ── FORM TOGGLE ──
function toggleBillDate {
 var type = document.getElementById('entry-type').value;
 document.getElementById('bill-due-group').style.display = (type === 'bills') ? 'flex' : 'none';
 document.getElementById('bill-recurring-group').style.display = (type === 'bills') ? 'flex' : 'none';
 document.getElementById('custom-category-group').style.display = (type === 'custom') ? 'flex' : 'none';
}

function togglePayFreq {
 var freq = document.getElementById('pay-frequency').value;
 document.getElementById('biweekly-start-group').style.display = (freq === 'biweekly') ? 'flex' : 'none';
}

function toggleNotifications {
 var enabled = document.getElementById('notif-enabled').checked;
 document.getElementById('notif-settings').style.display = enabled ? 'block' : 'none';
 if (enabled && Notification && Notification.permission !== 'granted') {
 Notification.requestPermission;
 }
}

// ── ADD ENTRY ──
function addEntry {
 var type = document.getElementById('entry-type').value;
 var desc = document.getElementById('entry-desc').value.trim;
 var amount = parseFloat(document.getElementById('entry-amount').value);
 var date = document.getElementById('entry-date').value;
 var customCat = document.getElementById('custom-category').value.trim;
 var billDueDay = parseInt(document.getElementById('bill-due-day').value) || null;
 var billRecurring = document.getElementById('bill-recurring').value;

 if (!desc || isNaN(amount) || amount <= 0 || !date) {
 alert('Please fill in description, amount, and date.');
 return;
 }

 var entry = {
 id: Date.now,
 type: type,
 desc: desc,
 amount: amount,
 date: date,
 customCat: (type === 'custom') ? customCat : '',
 billDueDay: (type === 'bills') ? billDueDay : null,
 billRecurring: (type === 'bills') ? billRecurring : 'no'
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
 entries = entries.filter(function(e) { return e.id !== id; });
 saveEntries;
 renderLog;
 updateDashboard;
}

// ── RENDER LOG ──
function renderLog {
 var filter = document.getElementById('filter-category').value;
 var tbody = document.getElementById('log-body');
 var filtered = (filter === 'all') ? entries : entries.filter(function(e) { return e.type === filter; });

 if (filtered.length === 0) {
 tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No entries yet.</td></tr>';
 return;
 }

 filtered.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

 var html = '';
 for (var i = 0; i < filtered.length; i++) {
 var e = filtered[i];
 var isIncome = (e.type === 'income');
 var label = (e.type === 'custom') ? (e.customCat || 'Custom') : e.type;
 var dueDisplay = e.billDueDay ? (e.billDueDay + ordinal(e.billDueDay)) : '-';
 html += '<tr>';
 html += '<td>' + formatDate(e.date) + '</td>';
 html += '<td>' + e.desc + '</td>';
 html += '<td><span class="category-badge ' + e.type + '">' + label + '</span></td>';
 html += '<td>' + dueDisplay + '</td>';
 html += '<td class="' + (isIncome ? 'amount-income' : 'amount-expense') + '">';
 html += (isIncome ? '+' : '-') + '$' + e.amount.toFixed(2) + '</td>';
 html += '<td><button class="btn-delete" onclick="deleteEntry(' + e.id + ')">Delete</button></td>';
 html += '</tr>';
 }
 tbody.innerHTML = html;
}

// ── DASHBOARD ──
function updateDashboard {
 var income = 0;
 var expenses = 0;
 for (var i = 0; i < entries.length; i++) {
 if (entries[i].type === 'income') {
 income += entries[i].amount;
 } else {
 expenses += entries[i].amount;
 }
 }
 var balance = income - expenses;

 document.getElementById('total-income').textContent = '$' + income.toFixed(2);
 document.getElementById('total-expenses').textContent = '$' + expenses.toFixed(2);

 var balEl = document.getElementById('balance');
 balEl.className = 'card-amount ' + (balance >= 0 ? 'positive' : 'negative');
 balEl.textContent = (balance < 0 ? '-' : '') + '$' + Math.abs(balance).toFixed(2);

 renderUpcoming;
}

// ── UPCOMING ──
function renderUpcoming {
 var list = document.getElementById('upcoming-list');
 var now = new Date;
 var items = ;

 for (var i = 0; i < entries.length; i++) {
 var e = entries[i];
 if (e.type === 'bills' && e.billDueDay) {
 var dueDate = new Date(now.getFullYear, now.getMonth, e.billDueDay);
 if (dueDate < now) dueDate.setMonth(dueDate.getMonth + 1);
 var diff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
 if (diff <= 7 && diff >= 0) {
 items.push({
 label: e.desc + ' - $' + e.amount.toFixed(2) + ' due in ' + diff + (diff !== 1 ? ' days' : ' day'),
 type: 'bill'
 });
 }
 }
 }

 if (payConfig) {
 var payDates = getPayDatesThisMonth;
 for (var j = 0; j < payDates.length; j++) {
 var diff2 = Math.ceil((payDates[j] - now) / (1000 * 60 * 60 * 24));
 if (diff2 <= 7 && diff2 >= 0) {
 items.push({
 label: 'Pay Day in ' + diff2 + (diff2 !== 1 ? ' days' : ' day'),
 type: 'pay'
 });
 }
 }
 }

 if (items.length === 0) {
 list.innerHTML = '<li class="empty-msg">Nothing due this week.</li>';
 return;
 }

 var html = '';
 for (var k = 0; k < items.length; k++) {
 html += '<li class="' + (items[k].type === 'pay' ? 'pay-item' : 'bill-item') + '">' + items[k].label + '</li>';
 }
 list.innerHTML = html;
}

// ── PAY DATE ──
function savePayDate {
 var day = parseInt(document.getElementById('pay-day').value);
 var freq = document.getElementById('pay-frequency').value;
 var biweeklyStart = document.getElementById('biweekly-start').value;

 if (!day && freq !== 'biweekly') {
 alert('Please enter your pay day.');
 return;
 }

 payConfig = { day: day, freq: freq, biweeklyStart: biweeklyStart };
 localStorage.setItem('kt_pay', JSON.stringify(payConfig));
 document.getElementById('pay-saved-msg').textContent = 'Pay date saved!';
 setTimeout(function { document.getElementById('pay-saved-msg').textContent = ''; }, 3000);
 renderCalendar;
}

function getPayDatesThisMonth {
 if (!payConfig) return ;
 var year = calYear;
 var month = calMonth;
 var dates = ;

 if (payConfig.freq === 'monthly') {
 dates.push(new Date(year, month, payConfig.day));
 } else if (payConfig.freq === 'biweekly' && payConfig.biweeklyStart) {
 var d = new Date(payConfig.biweeklyStart);
 while (d.getFullYear < year || (d.getFullYear === year && d.getMonth < month)) {
 d.setDate(d.getDate + 14);
 }
 while (d.getMonth === month && d.getFullYear === year) {
 dates.push(new Date(d));
 d.setDate(d.getDate + 14);
 }
 } else if (payConfig.freq === 'weekly') {
 for (var day = 1; day <= 31; day++) {
 var d2 = new Date(year, month, day);
 if (d2.getMonth !== month) break;
 if (d2.getDay === (payConfig.day % 7)) dates.push(d2);
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
 var grid = document.getElementById('cal-grid');
 var label = document.getElementById('cal-month-label');
 var monthNames = ['January','February','March','April','May','June',
 'July','August','September','October','November','December'];

 label.textContent = monthNames[calMonth] + ' ' + calYear;

 var firstDay = new Date(calYear, calMonth, 1).getDay;
 var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate;
 var now = new Date;

 var payDates = getPayDatesThisMonth.map(function(d) { return d.getDate; });
 var billDays = ;
 for (var i = 0; i < entries.length; i++) {
 if (entries[i].type === 'bills' && entries[i].billDueDay) {
 billDays.push(entries[i].billDueDay);
 }
 }

 var dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 var html = '';
 for (var h = 0; h < dayHeaders.length; h++) {
 html += '<div class="cal-day-header">' + dayHeaders[h] + '</div>';
 }

 for (var blank = 0; blank < firstDay; blank++) {
 html += '<div class="cal-day empty"></div>';
 }

 for (var day = 1; day <= daysInMonth; day++) {
 var isToday = (day === now.getDate && calMonth === now.getMonth && calYear === now.getFullYear);
 var isPay = (payDates.indexOf(day) !== -1);
 var isBill = (billDays.indexOf(day) !== -1);

 var classes = 'cal-day';
 if (isToday) classes += ' today';
 else if (isPay && isBill) classes += ' pay-day bill-day';
 else if (isPay) classes += ' pay-day';
 else if (isBill) classes += ' bill-day';

 var dots = '';
 if (isPay) dots += '<span class="cal-dot green"></span>';
 if (isBill) dots += '<span class="cal-dot red"></span>';

 html += '<div class="' + classes + '"><span>' + day + '</span>' + dots + '</div>';
 }

 grid.innerHTML = html;
}

// ── NOTIFICATIONS ──
function saveNotifSettings {
 notifConfig = {
 enabled: document.getElementById('notif-enabled').checked,
 billDays: parseInt(document.getElementById('bill-reminder-days').value) || 3,
 payDays: parseInt(document.getElementById('pay-reminder-days').value) || 1
 };
 localStorage.setItem('kt_notif', JSON.stringify(notifConfig));
 document.getElementById('notif-saved-msg').textContent = 'Notification settings saved!';
 setTimeout(function { document.getElementById('notif-saved-msg').textContent = ''; }, 3000);
 scheduleNotifications;
 renderReminders;
}

function scheduleNotifications {
 if (!notifConfig.enabled || !Notification || Notification.permission !== 'granted') return;
 var now = new Date;

 for (var i = 0; i < entries.length; i++) {
 var e = entries[i];
 if (e.type === 'bills' && e.billDueDay) {
 var dueDate = new Date(now.getFullYear, now.getMonth, e.billDueDay);
 if (dueDate < now) dueDate.setMonth(dueDate.getMonth + 1);
 var reminderDate = new Date(dueDate);
 reminderDate.setDate(reminderDate.getDate - notifConfig.billDays);
 var msUntil = reminderDate - now;
 if (msUntil > 0) {
 (function(entry) {
 setTimeout(function {
 new Notification('Keep Track - Bill Reminder', {
 body: entry.desc + ' ($' + entry.amount.toFixed(2) + ') is due in ' + notifConfig.billDays + ' days.'
 });
 }, msUntil);
 })(e);
 }
 }
 }

 if (payConfig) {
 var payDates = getPayDatesThisMonth;
 for (var j = 0; j < payDates.length; j++) {
 var reminderDate2 = new Date(payDates[j]);
 reminderDate2.setDate(reminderDate2.getDate - notifConfig.payDays);
 var msUntil2 = reminderDate2 - now;
 if (msUntil2 > 0) {
 (function(days) {
 setTimeout(function {
 new Notification('Keep Track - Pay Day Coming', {
 body: 'Your pay day arrives in ' + days + (days !== 1 ? ' days.' : ' day.')
 });
 }, msUntil2);
 })(notifConfig.payDays);
 }
 }
 }
}

// ── RENDER REMINDERS ──
function renderReminders {
 var list = document.getElementById('reminder-list');
 var now = new Date;
 var items = ;

 for (var i = 0; i < entries.length; i++) {
 var e = entries[i];
 if (e.type === 'bills' && e.billDueDay) {
 var dueDate = new Date(now.getFullYear, now.getMonth, e.billDueDay);
 if (dueDate < now) dueDate.setMonth(dueDate.getMonth + 1);
 var reminderDate = new Date(dueDate);
 reminderDate.setDate(reminderDate.getDate - notifConfig.billDays);
 items.push({
 label: e.desc + ' - reminder on ' + formatDate(reminderDate.toISOString.split('T')[0]) + ' (' + notifConfig.billDays + ' days before due)',
 type: 'bill'
 });
 }
 }

 if (payConfig) {
 var payDates = getPayDatesThisMonth;
 for (var j = 0; j < payDates.length; j++) {
 var reminderDate2 = new Date(payDates[j]);
 reminderDate2.setDate(reminderDate2.getDate - notifConfig.payDays);
 items.push({
 label: 'Pay Day reminder on ' + formatDate(reminderDate2.toISOString.split('T')[0]),
 type: 'pay'
 });
 }
 }

 if (items.length === 0) {
 list.innerHTML = '<li class="empty-msg">No reminders scheduled.</li>';
 return;
 }

 var html = '';
 for (var k = 0; k < items.length; k++) {
 html += '<li class="' + (items[k].type === 'pay' ? 'pay-item' : 'bill-item') + '">' + items[k].label + '</li>';
 }
 list.innerHTML = html;
}

// ── HELPERS ──
function formatDate(dateStr) {
 var parts = dateStr.split('-');
 var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 return months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[2]) + ', ' + parts[0];
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

// ── INIT ──
window.onload = function {
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
};
