window.staffViewReady.then(() => {
if (!document.getElementById('staff-page')) return;
const STAFF_MONTHLY_BASIC = 12000;
const STAFF_STANDARD_HOURS = 22 * 8;
const STAFF_HOURLY_RATE = STAFF_MONTHLY_BASIC / STAFF_STANDARD_HOURS;
const STAFF_ATTENDANCE_ID = 'demo-maria';
const attendanceWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const attendanceMonth = new Date();
let shownMonth = attendanceMonth.getMonth();
let shownYear = attendanceMonth.getFullYear();
let selectedAttendanceDate = localDateKey(new Date());

function getStaffMonthRecords(year = shownYear, month = shownMonth) {
  const prefix = `${STAFF_ATTENDANCE_ID}:`;
  return [...attendanceRecords.entries()]
    .filter(([key, record]) => key.startsWith(prefix) && record.timeIn && key.slice(prefix.length).startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`))
    .map(([key, record]) => ({ date: key.slice(prefix.length), ...record }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function attendanceMinutes(record) {
  if (!record?.timeIn || !record?.timeOut) return 0;
  return Math.max(0, Math.floor((new Date(record.timeOut) - new Date(record.timeIn)) / 60000));
}

function formatWorkedTime(minutes) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatAttendanceMoney(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAttendanceTime(value) {
  if (!value) return '—';
  let timeFormat = '12-hour';
  try { timeFormat = JSON.parse(localStorage.getItem('integrain-settings'))?.timeFormat || timeFormat; } catch { /* Use the default time format. */ }
  return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: timeFormat !== '24-hour' });
}

function renderAttendanceCalendar(calendarId, labelId) {
  const calendar = document.getElementById(calendarId);
  const label = document.getElementById(labelId);
  if (!calendar || !label) return;
  const firstDay = new Date(shownYear, shownMonth, 1).getDay();
  const daysInMonth = new Date(shownYear, shownMonth + 1, 0).getDate();
  const monthName = new Date(shownYear, shownMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  label.textContent = monthName;
  const recordDates = new Map(getStaffMonthRecords().map(record => [record.date, record]));
  const today = localDateKey(new Date());
  const headings = attendanceWeekdays.map(day => `<span class="weekday">${day}</span>`).join('');
  const blanks = Array.from({ length: firstDay }, () => '<span class="calendar-empty" aria-hidden="true"></span>').join('');
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${shownYear}-${String(shownMonth + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    const record = recordDates.get(date);
    const classes = ['calendar-day'];
    if (record) classes.push('marked', record.timeOut ? 'has-attendance' : 'in-progress');
    if (date === today) classes.push('today');
    if (date === selectedAttendanceDate) classes.push('selected');
    const attendanceLabel = record ? (record.timeOut ? 'Present' : 'Time in recorded, time out pending') : 'No attendance recorded';
    return `<button type="button" class="${classes.join(' ')}" data-attendance-date="${date}" aria-label="${date}: ${attendanceLabel}" aria-pressed="${date === selectedAttendanceDate}">${index + 1}${record ? '<i aria-hidden="true"></i>' : ''}</button>`;
  }).join('');
  calendar.innerHTML = headings + blanks + days;
}

function updateAttendanceDetail(prefix, date, record) {
  const selected = document.getElementById(`${prefix}-selected-date`);
  if (!selected) return;
  selected.textContent = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const hours = attendanceMinutes(record);
  const totalHours = hours / 60;
  const set = (suffix, text) => { const element = document.getElementById(`${prefix}-${suffix}`); if (element) element.textContent = text; };
  set('time-in', formatAttendanceTime(record?.timeIn));
  set('time-out', formatAttendanceTime(record?.timeOut));
  if (prefix === 'attendance') {
    set('selected-hours', record?.timeOut ? formatWorkedTime(hours) : record?.timeIn ? 'In progress' : '—');
    set('selected-pay', record?.timeOut ? formatAttendanceMoney(totalHours * STAFF_HOURLY_RATE) : '—');
  } else {
    set('hours', record?.timeOut ? formatWorkedTime(hours) : record?.timeIn ? 'In progress' : '—');
  }
}

function renderStaffAttendance() {
  const monthRecords = getStaffMonthRecords();
  const completeMinutes = monthRecords.reduce((total, record) => total + attendanceMinutes(record), 0);
  const earned = completeMinutes / 60 * STAFF_HOURLY_RATE;
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
  const todayRecord = attendanceRecords.get(`${STAFF_ATTENDANCE_ID}:${localDateKey(new Date())}`);
  setText('staff-today-status', todayRecord?.timeOut ? 'Present' : todayRecord?.timeIn ? 'In progress' : 'No record');
  setText('staff-today-time', todayRecord?.timeIn ? `Time in ${formatAttendanceTime(todayRecord.timeIn)}${todayRecord.timeOut ? ` · Time out ${formatAttendanceTime(todayRecord.timeOut)}` : ''}` : 'No time entry today');
  setText('attendance-present-count', `${monthRecords.length} day${monthRecords.length === 1 ? '' : 's'}`);
  setText('attendance-hours-count', formatWorkedTime(completeMinutes));
  setText('attendance-earned-pay', formatAttendanceMoney(earned));
  renderAttendanceCalendar('calendar', 'month-label');
  renderAttendanceCalendar('attendance-calendar', 'attendance-month-label');
  const selectedRecord = attendanceRecords.get(`${STAFF_ATTENDANCE_ID}:${selectedAttendanceDate}`);
  updateAttendanceDetail('overview', selectedAttendanceDate, selectedRecord);
  updateAttendanceDetail('attendance', selectedAttendanceDate, selectedRecord);

  const log = document.getElementById('staff-attendance-log');
  if (log) {
    log.innerHTML = monthRecords.length ? [...monthRecords].reverse().map(record => {
      const minutes = attendanceMinutes(record);
      const status = record.timeOut ? 'Present' : 'In progress';
      return `<tr><td>${new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td><td>${formatAttendanceTime(record.timeIn)}</td><td>${formatAttendanceTime(record.timeOut)}</td><td>${record.timeOut ? formatWorkedTime(minutes) : 'In progress'}</td><td><span class="status-pill ${record.timeOut ? 'status-paid' : 'status-pending'}">${status}</span></td></tr>`;
    }).join('') : '<tr><td colspan="5" class="attendance-empty">No attendance records for this month yet.</td></tr>';
  }
  renderStaffSalary();
}

function renderStaffSalary() {
  const records = getStaffMonthRecords();
  const totalMinutes = records.reduce((total, record) => total + attendanceMinutes(record), 0);
  const earned = totalMinutes / 60 * STAFF_HOURLY_RATE;
  let advances = [];
  try { advances = JSON.parse(localStorage.getItem('integrain-salary-requests')) || []; } catch { advances = []; }
  const currentMonth = localDateKey(new Date()).slice(0, 7);
  const advanceAmount = advances.filter(request => request.employeeName === 'Maria Reyes' && request.status === 'approved' && String(request.approvedAt || '').slice(0, 7) === currentMonth)
    .reduce((sum, request) => sum + Number(request.amount || 0), 0);
  const values = {
    'staff-total-earned-pay': formatAttendanceMoney(earned),
    'staff-earned-pay': formatAttendanceMoney(earned),
    'salary-hours-worked': formatWorkedTime(totalMinutes),
    'salary-hourly-rate': formatAttendanceMoney(STAFF_HOURLY_RATE),
    'salary-earned-basic': formatAttendanceMoney(earned),
    'salary-advance-deduction': formatAttendanceMoney(advanceAmount),
    'salary-estimated-net': formatAttendanceMoney(Math.max(0, earned - advanceAmount))
  };
  Object.entries(values).forEach(([id, value]) => { const element = document.getElementById(id); if (element) element.textContent = value; });
}

function shiftAttendanceMonth(delta) {
  const month = new Date(shownYear, shownMonth + delta, 1);
  shownYear = month.getFullYear();
  shownMonth = month.getMonth();
  selectedAttendanceDate = `${shownYear}-${String(shownMonth + 1).padStart(2, '0')}-01`;
  renderStaffAttendance();
}

renderStaffAttendance();
document.getElementById('prev-month').addEventListener('click', () => shiftAttendanceMonth(-1));
document.getElementById('next-month').addEventListener('click', () => shiftAttendanceMonth(1));
document.getElementById('attendance-prev-month').addEventListener('click', () => shiftAttendanceMonth(-1));
document.getElementById('attendance-next-month').addEventListener('click', () => shiftAttendanceMonth(1));
document.addEventListener('click', event => {
  const day = event.target.closest('[data-attendance-date]');
  if (!day) return;
  selectedAttendanceDate = day.dataset.attendanceDate;
  renderStaffAttendance();
});
window.addEventListener('attendance-records-updated', renderStaffAttendance);
document.getElementById('request-advance').addEventListener('click', () => {
  const amountField = document.getElementById('advance-amount');
  const reasonField = document.getElementById('advance-reason');
  const amount = Number(amountField.value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 12000) {
    window.toast('Enter an amount between ₱1 and ₱12,000.');
    amountField.focus();
    return;
  }
  if (!reasonField.value.trim()) {
    window.toast('Enter a reason for the request.');
    reasonField.focus();
    return;
  }
  const request = { id: `advance-${Date.now()}`, employeeName: 'Maria Reyes', amount, reason: reasonField.value.trim(), createdAt: new Date().toISOString(), status: 'pending' };
  let requests = [];
  try { requests = JSON.parse(localStorage.getItem('integrain-salary-requests')) || []; } catch { requests = []; }
  requests.unshift(request);
  try { localStorage.setItem('integrain-salary-requests', JSON.stringify(requests)); }
  catch { window.toast('The request could not be saved in browser storage.'); return; }
  refreshStaffAdvanceStatus();
  amountField.value = '';
  reasonField.value = '';
  window.toast('Salary advance request submitted.');
});

function refreshStaffAdvanceStatus() {
  const statusElement = document.getElementById('staff-request-status');
  if (!statusElement) return;
  let requests = [];
  try { requests = JSON.parse(localStorage.getItem('integrain-salary-requests')) || []; } catch { requests = []; }
  const request = requests.find(item => item.employeeName === 'Maria Reyes');
  if (!request) { statusElement.innerHTML = '<span>No request yet.</span>'; return; }
  const statusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }[request.status] || 'Pending';
  const statusClass = request.status === 'approved' ? 'status-paid' : request.status === 'rejected' ? 'status-absent' : 'status-pending';
  statusElement.innerHTML = `<span class="status-pill ${statusClass}">${statusLabel}</span><span>Advance request · ₱ ${Number(request.amount).toLocaleString('en-PH')} · ${new Date(request.createdAt).toLocaleDateString('en-PH')}</span>`;
}

window.staffPortal = { renderStaffAttendance, renderStaffSalary, refreshStaffAdvanceStatus };
});
