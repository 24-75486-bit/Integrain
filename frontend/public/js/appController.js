window.staffViewReady.then(() => {
function setSidebarToggleIcon(button, collapsed) {
  const path = collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6';
  button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"></path></svg>`;
}

let currentUser = null;
let settingsTrigger = null;

function activateUser(email, role) {
  const defaultName = role === 'staff' ? 'Maria Reyes' : 'Store Admin';
  let savedName = defaultName;
  try { savedName = localStorage.getItem(`integrain-profile-${role}`) || defaultName; } catch { /* Use the demo name. */ }
  currentUser = { email, role, name: savedName, title: role === 'staff' ? 'Staff' : 'Administrator' };
  currentUser.initials = currentUser.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
  document.querySelectorAll(`[data-profile-role="${role}"]`).forEach(profile => {
    profile.querySelector('[data-profile-name]').textContent = currentUser.name;
    profile.querySelector('[data-profile-title]').textContent = currentUser.title;
    profile.querySelector('[data-profile-initials]').textContent = currentUser.initials;
  });
  document.querySelectorAll(`[data-profile-role="${role}"]`).forEach(profile => {
    const panel = profile.closest('.sidebar').querySelector('[data-account-email]');
    if (panel) panel.textContent = currentUser.email;
  });
  const avatar = document.querySelector(`#${role}-page .portal-heading .avatar`);
  if (avatar) avatar.textContent = currentUser.initials;
}

function openSettings(trigger) {
  settingsTrigger = trigger;
  const dialog = document.getElementById('settings-dialog');
  if (!dialog || !currentUser) return;
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem('integrain-settings')) || {}; } catch { preferences = {}; }
  document.getElementById('settings-display-name').value = currentUser.name;
  document.getElementById('settings-email').textContent = currentUser.email;
  document.getElementById('settings-role').textContent = currentUser.title;
  document.getElementById('settings-time-format').value = preferences.timeFormat || '12-hour';
  document.getElementById('settings-attendance-reminders').checked = Boolean(preferences.attendanceReminders);
  document.getElementById('settings-payroll-updates').checked = Boolean(preferences.payrollUpdates);
  document.getElementById('settings-saved').textContent = '';
  dialog.hidden = false;
  document.getElementById('settings-display-name').focus();
}

function closeSettings() {
  const dialog = document.getElementById('settings-dialog');
  if (!dialog) return;
  dialog.hidden = true;
  if (settingsTrigger) settingsTrigger.focus();
  settingsTrigger = null;
}

function scrollPageToTop() {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.scrollTop = 0;
  document.body.scrollTop = 0;
  requestAnimationFrame(() => { root.style.scrollBehavior = previousScrollBehavior; });
}

function showPage(name) {
  const view = document.querySelector(`[data-view="${name}"]`); if (!view) return;
  document.body.classList.toggle('portal-view', name === 'staff' || name === 'admin');
  document.body.classList.remove('sidebar-collapsed');
  document.querySelectorAll('.sidebar-toggle').forEach(button => {
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Hide sidebar');
    setSidebarToggleIcon(button, false);
  });
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p === view));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.page === name));
  document.querySelector('.top-nav').classList.remove('open'); document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  if (name === 'admin') loadAdminModule('overview');
  scrollPageToTop();
  requestAnimationFrame(scrollPageToTop);
}
window.addEventListener('pageshow', scrollPageToTop);
function openLogin() { document.getElementById('login-error').textContent = ''; document.getElementById('login-form').reset(); showPage('login'); }
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-account-panel], [data-account-toggle]')) {
    document.querySelectorAll('[data-account-panel]').forEach(panel => { panel.hidden = true; });
    document.querySelectorAll('[data-account-toggle]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  }
  const sidebarToggle = e.target.closest('.sidebar-toggle'); if (sidebarToggle) {
    const collapsed = document.body.classList.toggle('sidebar-collapsed');
    document.querySelectorAll('.sidebar-toggle').forEach(button => {
      button.setAttribute('aria-expanded', String(!collapsed));
      button.setAttribute('aria-label', collapsed ? 'Show sidebar' : 'Hide sidebar');
      setSidebarToggleIcon(button, collapsed);
    });
    return;
  }
  const login = e.target.closest('[data-login]'); if (login) { openLogin(); return; }
  const apply = e.target.closest('[data-apply-start]'); if (apply) { e.preventDefault(); startJobApplication(); return; }
  const accountToggle = e.target.closest('[data-account-toggle]'); if (accountToggle) {
    const sidebar = accountToggle.closest('.sidebar');
    const panel = sidebar.querySelector('[data-account-panel]');
    const open = panel.hidden;
    document.querySelectorAll('[data-account-panel]').forEach(item => { item.hidden = true; });
    document.querySelectorAll('[data-account-toggle]').forEach(item => item.setAttribute('aria-expanded', 'false'));
    panel.hidden = !open;
    accountToggle.setAttribute('aria-expanded', String(open));
    return;
  }
  const settings = e.target.closest('[data-settings-open]'); if (settings) {
    const panel = settings.closest('[data-account-panel]');
    let focusTarget = settings;
    if (panel) {
      const sidebar = panel.closest('.sidebar');
      focusTarget = sidebar.querySelector('[data-account-toggle]');
      panel.hidden = true;
      focusTarget.setAttribute('aria-expanded', 'false');
    }
    openSettings(focusTarget); return;
  }
  if (e.target.closest('[data-settings-close]') || e.target.id === 'settings-dialog') { closeSettings(); return; }
  const logout = e.target.closest('[data-logout]'); if (logout) { if (!await confirmAdminAction('Are you sure you want to log out?')) return; currentUser = null; document.querySelectorAll('[data-account-panel]').forEach(item => { item.hidden = true; }); document.querySelectorAll('[data-account-toggle]').forEach(item => item.setAttribute('aria-expanded', 'false')); closeSettings(); showPage('home'); return; }
  const page = e.target.closest('[data-page]'); if (page) { e.preventDefault(); showPage(page.dataset.page); return; }
  const add = e.target.closest('[data-add]'); if (add) { toast(`${add.dataset.add} added to your basket`); return; }
  const filter = e.target.closest('[data-filter]'); if (filter) { document.querySelectorAll('.filter').forEach(f => f.classList.toggle('active', f === filter)); renderProducts('all-products', filter.dataset.filter === 'All' ? products : products.filter(p => p.type === filter.dataset.filter)); return; }
  const staff = e.target.closest('[data-staff]'); if (staff) {
    e.preventDefault();
    const section = staff.dataset.staff;
    const labels = {
      overview: ['Good morning, Maria', 'Here is your personal overview.'],
      transactions: ['My Transactions', 'Review your salary, bonus, and deduction history.'],
      attendance: ['My Attendance', 'Your work days and time records at a glance.'],
      salary: ['Salary & Requests', 'Review your pay and manage salary advance requests.']
    };
    document.querySelectorAll('#staff-page [data-staff-view]').forEach(view => {
      view.hidden = view.dataset.staffView !== section;
    });
    document.querySelectorAll('#staff-page [data-staff].side-link').forEach(link => {
      const selected = link.dataset.staff === section;
      link.classList.toggle('selected', selected);
      link.setAttribute('aria-current', selected ? 'page' : 'false');
    });
    document.getElementById('staff-heading').textContent = (labels[section] || labels.overview)[0];
    document.getElementById('staff-subheading').textContent = (labels[section] || labels.overview)[1];
    if (section === 'attendance') window.staffPortal.renderStaffAttendance();
    if (section === 'salary') { window.staffPortal.refreshStaffAdvanceStatus(); window.staffPortal.renderStaffSalary(); }
    return;
  }
  const admin = e.target.closest('[data-admin]'); if (admin) { e.preventDefault(); document.querySelectorAll('[data-admin].side-link').forEach(x => x.classList.toggle('selected', x === admin)); loadAdminModule(admin.dataset.admin); return; }
  const quick = e.target.closest('.quick-question'); if (quick) { sendChat(quick.textContent); return; }
});
const menu = document.querySelector('.menu-toggle'); menu.addEventListener('click', () => { const nav = document.querySelector('.top-nav'), open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
const demoRoles = { 'admin@junbebot.com': 'admin', 'staff@junbebot.com': 'staff' };
function enterDemoLocally(email) {
  const role = demoRoles[email];
  if (!role) return false;
  activateUser(email, role);
  document.getElementById('login-error').textContent = '';
  showPage(role);
  toast('Demo login: the app is running in local mode.');
  return true;
}
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const responseText = await response.text();
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : null;
    } catch {
      result = null;
    }
    if (!result || typeof result !== 'object') {
      if (response.status === 404 && enterDemoLocally(email)) return;
      throw new Error('The login server returned an invalid response. Start the backend and open the app at http://localhost:3000.');
    }
    if (!response.ok) throw new Error(result.message || 'Unable to sign in.');
    if (!result.role) throw new Error('The login response did not include a role. Refresh the app and try again.');
    document.getElementById('login-error').textContent = '';
    activateUser(email, result.role);
    showPage(result.role);
  } catch (error) {
    if (error instanceof TypeError && enterDemoLocally(email)) return;
    document.getElementById('login-error').textContent = error.message === 'Failed to fetch'
      ? 'The server could not be reached. Start the backend first.'
      : error.message;
  }
});
document.getElementById('toggle-password').addEventListener('click', e => { const input = document.getElementById('login-password'), visible = input.type === 'password'; input.type = visible ? 'text' : 'password'; e.currentTarget.textContent = visible ? 'Hide' : 'Show'; e.currentTarget.setAttribute('aria-label', visible ? 'Hide password' : 'Show password'); });
function toast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 2600) }
  window.toast = toast;
document.getElementById('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!currentUser) return;
  const name = document.getElementById('settings-display-name').value.trim();
  if (!name) return;
  const settings = {
    timeFormat: document.getElementById('settings-time-format').value,
    attendanceReminders: document.getElementById('settings-attendance-reminders').checked,
    payrollUpdates: document.getElementById('settings-payroll-updates').checked
  };
  try {
    localStorage.setItem(`integrain-profile-${currentUser.role}`, name);
    localStorage.setItem('integrain-settings', JSON.stringify(settings));
  } catch {
    document.getElementById('settings-saved').textContent = 'Could not save settings in browser storage.';
    return;
  }
  const email = currentUser.email;
  const role = currentUser.role;
  activateUser(email, role);
  document.getElementById('settings-display-name').value = currentUser.name;
  document.getElementById('settings-saved').textContent = 'Settings saved on this device.';
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!document.getElementById('settings-dialog').hidden) closeSettings();
    document.querySelectorAll('[data-account-panel]').forEach(panel => { panel.hidden = true; });
    document.querySelectorAll('[data-account-toggle]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  }
});

});
