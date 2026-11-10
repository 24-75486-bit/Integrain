const adminModuleNames = {
  overview: 'dashboard',
  employees: 'employees',
  attendance: 'attendance',
  products: 'products',
  applicants: 'applicants',
  salary: 'salary',
  reports: 'reports'
};

function confirmAdminAction(message) {
  let dialog = document.getElementById('admin-confirm-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'admin-confirm-dialog';
    dialog.className = 'admin-confirm-overlay';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'admin-confirm-message');
    dialog.hidden = true;
    dialog.innerHTML = '<div class="admin-confirm-panel"><p id="admin-confirm-message"></p><div class="admin-confirm-actions"><button type="button" class="button secondary" data-confirm-no>No</button><button type="button" class="button" data-confirm-yes>Yes</button></div></div>';
    document.body.append(dialog);
  }

  return new Promise(resolve => {
    const finish = answer => {
      dialog.hidden = true;
      dialog.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
      resolve(answer);
    };
    const handleClick = event => {
      if (event.target === dialog || event.target.closest('[data-confirm-no]')) finish(false);
      else if (event.target.closest('[data-confirm-yes]')) finish(true);
    };
    const handleKeydown = event => {
      if (event.key === 'Escape') finish(false);
    };
    dialog.querySelector('#admin-confirm-message').textContent = message;
    dialog.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    dialog.hidden = false;
    dialog.querySelector('[data-confirm-yes]').focus();
  });
}

async function loadAdminModule(name) {
  const moduleName = adminModuleNames[name] || 'dashboard';
  const target = document.getElementById('admin-module-content');
  const heading = document.getElementById('admin-heading');
  if (!target || !heading) return;

  heading.textContent = moduleName === 'salary' ? 'Payroll & Salary' : moduleName[0].toUpperCase() + moduleName.slice(1);
  target.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(`/views/admin/${moduleName}.html`);
    if (!response.ok) throw new Error('Unable to load this section.');
    target.innerHTML = await response.text();
    if (moduleName === 'employees') initializeEmployeeDirectory(target);
    if (moduleName === 'products') await initializeProductManager(target);
    if (moduleName === 'salary') initializeSalaryManager(target);
  } catch (error) {
    target.innerHTML = '<section class="panel"><p>Unable to load this section. Make sure the backend is running.</p></section>';
  } finally {
    target.removeAttribute('aria-busy');
  }
}

const employeeStorageKey = 'integrain-employees';
const attendanceRecords = new Map();
const demoEmployees = [
  { id: 'demo-maria', name: 'Maria Reyes', position: 'Store Staff', birthday: '', picture: '' },
  { id: 'demo-juan', name: 'Juan Santos', position: 'Cashier', birthday: '', picture: '' },
  { id: 'demo-ana', name: 'Ana Cruz', position: 'Delivery Staff', birthday: '', picture: '' }
];

function escapeEmployeeText(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function employeeAge(birthday) {
  if (!birthday) return '—';
  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
  return age >= 0 ? age : '—';
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayAttendanceTime(value) {
  if (!value) return '—';
  let timeFormat = '12-hour';
  try { timeFormat = JSON.parse(localStorage.getItem('integrain-settings'))?.timeFormat || timeFormat; } catch { /* Keep the default clock format. */ }
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: timeFormat !== '24-hour' });
}

function initializeEmployeeDirectory(root) {
  const list = root.querySelector('#employee-list');
  const form = root.querySelector('#employee-form');
  if (!list || !form) return;

  let employees;
  try { employees = JSON.parse(localStorage.getItem(employeeStorageKey)) || [...demoEmployees]; }
  catch { employees = [...demoEmployees]; }
  const render = () => {
    const today = localDateKey();
    list.innerHTML = employees.map(employee => {
      const record = attendanceRecords.get(`${employee.id}:${today}`) || {};
      const state = !record.timeIn ? 'Not timed in' : record.timeOut ? 'Complete' : 'In progress';
      const action = !record.timeIn ? 'Time in' : record.timeOut ? 'Done' : 'Time out';
      return `<tr>
      <td><div class="employee-name-cell">${employee.picture ? `<img class="employee-thumbnail" src="${employee.picture}" alt="">` : '<span class="employee-thumbnail employee-placeholder" aria-hidden="true">&#128100;</span>'}<span>${escapeEmployeeText(employee.name)}</span></div></td>
      <td>${escapeEmployeeText(employee.position) || '—'}</td>
      <td>${employee.birthday ? new Date(`${employee.birthday}T00:00:00`).toLocaleDateString() : '—'}</td>
      <td>${employeeAge(employee.birthday)}</td>
      <td>${displayAttendanceTime(record.timeIn)}</td>
      <td>${displayAttendanceTime(record.timeOut)}</td>
      <td><div class="attendance-controls"><span class="attendance-state ${record.timeOut ? 'is-complete' : record.timeIn ? 'is-active' : ''}">${state}</span><button type="button" class="employee-time-button" data-employee-time="${escapeEmployeeText(employee.id)}" ${record.timeOut ? 'disabled' : ''}>${action}</button></div></td>
      <td><div class="employee-row-actions"><button type="button" class="employee-edit" data-employee-edit="${escapeEmployeeText(employee.id)}">Edit</button>${employee.id && !String(employee.id).startsWith('demo-') ? `<button type="button" class="employee-remove" data-employee-remove="${escapeEmployeeText(employee.id)}" aria-label="Remove ${escapeEmployeeText(employee.name)}">Remove</button>` : ''}</div></td>
    </tr>`;
    }).join('');
  };
  render();

  const birthdayInput = form.querySelector('[name="birthday"]');
  const ageInput = form.querySelector('[name="age"]');
  birthdayInput.max = new Date().toISOString().slice(0, 10);
  birthdayInput.addEventListener('input', () => { ageInput.value = employeeAge(birthdayInput.value) === '—' ? '' : employeeAge(birthdayInput.value); });

  const pictureInput = form.querySelector('[name="picture"]');
  const preview = root.querySelector('#employee-photo-preview');
  let picture = '';
  let editingEmployeeId = null;
  const message = root.querySelector('#employee-form-message');
  const showPicturePreview = value => {
    picture = value || '';
    preview.innerHTML = picture ? `<img src="${picture}" alt="Selected employee picture">` : 'Picture preview';
  };
  const resetEmployeeForm = () => {
    editingEmployeeId = null;
    form.classList.remove('is-editing');
    form.reset();
    ageInput.value = '';
    showPicturePreview('');
    message.textContent = '';
    form.querySelector('h3').textContent = 'Employee details';
    form.querySelector('[type="submit"]').textContent = 'Save employee';
  };
  root.querySelectorAll('[data-employee-form-toggle]').forEach(button => button.addEventListener('click', async () => {
    if (form.hidden) {
      if (!await confirmAdminAction('Do you want to add an employee?')) return;
      resetEmployeeForm();
      form.hidden = false;
      form.querySelector('[name="name"]').focus();
    } else {
      resetEmployeeForm();
      form.hidden = true;
    }
  }));
  pictureInput.addEventListener('change', () => {
    const file = pictureInput.files[0];
    picture = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      pictureInput.value = '';
      message.textContent = 'Choose an image no larger than 5 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 500 / Math.max(image.width, image.height));
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        showPicturePreview(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const employee = { id: editingEmployeeId || `employee-${Date.now()}`, name: data.get('name').trim(), position: data.get('position').trim(), birthday: data.get('birthday'), picture };
    const previousEmployees = employees;
    if (editingEmployeeId) employees = employees.map(item => item.id === editingEmployeeId ? employee : item);
    else employees.push(employee);
    try {
      localStorage.setItem(employeeStorageKey, JSON.stringify(employees));
    } catch {
      employees = previousEmployees;
      message.textContent = 'Could not save: browser storage is full. Try a smaller image.';
      return;
    }
    render();
    resetEmployeeForm();
    form.hidden = true;
  });

  list.addEventListener('click', async event => {
    const timeButton = event.target.closest('[data-employee-time]');
    if (timeButton) {
      const now = new Date();
      const key = `${timeButton.dataset.employeeTime}:${localDateKey(now)}`;
      const record = attendanceRecords.get(key) || {};
      if (!record.timeIn) record.timeIn = now.toISOString();
      else if (!record.timeOut) record.timeOut = now.toISOString();
      attendanceRecords.set(key, record);
      render();
      window.dispatchEvent(new CustomEvent('attendance-records-updated'));
      return;
    }
    const editButton = event.target.closest('[data-employee-edit]');
    if (editButton) {
      const employee = employees.find(item => item.id === editButton.dataset.employeeEdit);
      if (!employee) return;
      if (!await confirmAdminAction(`Do you want to edit ${employee.name}?`)) return;
      editingEmployeeId = employee.id;
      form.classList.add('is-editing');
      form.elements.name.value = employee.name;
      form.elements.position.value = employee.position || '';
      form.elements.birthday.value = employee.birthday || '';
      ageInput.value = employeeAge(employee.birthday) === '—' ? '' : employeeAge(employee.birthday);
      showPicturePreview(employee.picture);
      message.textContent = '';
      form.querySelector('h3').textContent = `Edit ${employee.name}`;
      form.querySelector('[type="submit"]').textContent = 'Save changes';
      form.hidden = false;
      form.querySelector('[name="name"]').focus();
      return;
    }
    const button = event.target.closest('[data-employee-remove]');
    if (!button) return;
    employees = employees.filter(employee => employee.id !== button.dataset.employeeRemove);
    localStorage.setItem(employeeStorageKey, JSON.stringify(employees));
    render();
  });
}

const adminProductStorageKey = 'integrain-products';
const demoProducts = [
  { name: 'Regular Milagrosa', type: 'Regular', price: 42, weight: 'per kg', photo: 'photo-1586201375761-83865001e31c' },
  { name: 'Well Milled Rice', type: 'Well Milled', price: 46, weight: 'per kg', photo: 'photo-1592997571659-0b21ff64313b' },
  { name: 'Premium Rice', type: 'Premium', price: 52, weight: 'per kg', photo: 'photo-1536304993881-ff6e9eefa2a6' },
  { name: 'Sinandomeng', type: 'Regular', price: 44, weight: 'per kg', photo: 'photo-1574323347407-f5e1ad6d020b' },
  { name: 'Jasmine Rice', type: 'Premium', price: 48, weight: 'per kg', photo: 'photo-1516684732162-798a0062be99' },
  { name: 'Brown Rice', type: 'Well Milled', price: 56, weight: 'per kg', photo: 'photo-1586201375761-83865001e31c' },
  { name: 'Dinorado Rice', type: 'Premium', price: 50, weight: 'per kg', photo: 'photo-1592997571659-0b21ff64313b' },
  { name: 'Long Grain Rice', type: 'Regular', price: 40, weight: 'per kg', photo: 'photo-1536304993881-ff6e9eefa2a6' }
].map((product, index) => ({ ...product, id: `demo-product-${index}` }));

function escapeProductText(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

async function initializeProductManager(root) {
  const list = root.querySelector('#admin-product-list');
  const form = root.querySelector('#product-form');
  if (!list || !form) return;

  let products;
  try {
    const stored = localStorage.getItem(adminProductStorageKey);
    if (stored) products = JSON.parse(stored);
  } catch { /* Fall back to the demo catalog. */ }
  if (!Array.isArray(products)) {
    try {
      const response = await fetch('/api/products');
      products = response.ok ? await response.json() : [...demoProducts];
    } catch { products = [...demoProducts]; }
    products = products.map((product, index) => ({ ...product, id: product.id || `demo-product-${index}` }));
  }

  const publish = () => {
    localStorage.setItem(adminProductStorageKey, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('integrain-products-updated', { detail: products }));
  };
  const render = () => {
    list.innerHTML = products.map(product => `<tr><td><div class="product-admin-name">${product.image ? `<img src="${product.image}" alt="">` : '<span class="product-admin-placeholder">Rice</span>'}<b>${escapeProductText(product.name)}</b></div></td><td>${escapeProductText(product.type)}</td><td>₱${Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td><td>${escapeProductText(product.weight || 'per kg')}</td><td><button type="button" class="employee-edit" data-product-edit="${escapeProductText(product.id)}">Edit</button></td></tr>`).join('');
  };
  render();

  let editingId = null;
  let image = '';
  const imageInput = form.elements.image;
  const preview = root.querySelector('#product-image-preview');
  const message = root.querySelector('#product-form-message');
  const showPreview = value => {
    image = value || '';
    preview.innerHTML = image ? `<img src="${image}" alt="Selected rice product">` : 'Picture preview';
  };
  const reset = () => {
    editingId = null;
    form.reset();
    form.classList.remove('is-editing');
    form.querySelector('h3').textContent = 'Rice details';
    form.querySelector('[type="submit"]').textContent = 'Save rice';
    showPreview('');
    message.textContent = '';
  };
  root.querySelectorAll('[data-product-form-toggle]').forEach(button => button.addEventListener('click', async () => {
    const opening = form.hidden;
    if (opening && !await confirmAdminAction('Do you want to add a rice product?')) return;
    reset();
    form.hidden = !opening;
    if (opening) form.elements.name.focus();
  }));
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      imageInput.value = '';
      message.textContent = 'Choose an image no larger than 5 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const photo = new Image();
      photo.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 600 / Math.max(photo.width, photo.height));
        canvas.width = Math.round(photo.width * scale);
        canvas.height = Math.round(photo.height * scale);
        canvas.getContext('2d').drawImage(photo, 0, 0, canvas.width, canvas.height);
        showPreview(canvas.toDataURL('image/jpeg', 0.82));
      };
      photo.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const product = {
      id: editingId || `product-${Date.now()}`,
      name: data.get('name').trim(),
      type: data.get('type'),
      price: Number(data.get('price')),
      weight: data.get('weight'),
      image: image || products.find(item => item.id === editingId)?.image || '',
      photo: products.find(item => item.id === editingId)?.photo || ''
    };
    const previousProducts = products;
    if (editingId) products = products.map(item => item.id === editingId ? product : item);
    else products.unshift(product);
    try { publish(); }
    catch {
      products = previousProducts;
      message.textContent = 'Could not save. Try a smaller image or free up browser storage.';
      return;
    }
    render();
    reset();
    form.hidden = true;
  });
  list.addEventListener('click', async event => {
    const button = event.target.closest('[data-product-edit]');
    if (!button) return;
    const product = products.find(item => item.id === button.dataset.productEdit);
    if (!product) return;
    if (!await confirmAdminAction(`Do you want to edit ${product.name}?`)) return;
    editingId = product.id;
    form.classList.add('is-editing');
    form.elements.name.value = product.name;
    form.elements.type.value = product.type;
    form.elements.price.value = product.price;
    form.elements.weight.value = product.weight || 'per kg';
    showPreview(product.image);
    form.querySelector('h3').textContent = `Edit ${product.name}`;
    form.querySelector('[type="submit"]').textContent = 'Save changes';
    message.textContent = '';
    form.hidden = false;
    form.elements.name.focus();
  });
}

const salaryRequestsKey = 'integrain-salary-requests';
const payrollStatusKey = 'integrain-payroll-status';
const payrollDemoEmployees = [
  { id: 'demo-maria', name: 'Maria Reyes', salary: 12000, allowance: 2000 },
  { id: 'demo-juan', name: 'Juan Santos', salary: 13500, allowance: 1500 },
  { id: 'demo-ana', name: 'Ana Cruz', salary: 12500, allowance: 1000 }
];

function readSalaryData(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch { return fallback; }
}

function initializeSalaryManager(root) {
  const requestList = root.querySelector('#salary-request-list');
  const payrollList = root.querySelector('#salary-payroll-list');
  if (!requestList || !payrollList) return;

  const monthKey = localDateKey().slice(0, 7);
  root.querySelector('#salary-month').textContent = new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  const money = amount => `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const loadRequests = () => readSalaryData(salaryRequestsKey, []);
  const loadPayrollStatus = () => readSalaryData(payrollStatusKey, {});

  const render = () => {
    const requests = loadRequests();
    const payrollStatus = loadPayrollStatus();
    const pending = requests.filter(request => request.status === 'pending');
    const profiles = readSalaryData(employeeStorageKey, [...demoEmployees]);
    const profileList = Array.isArray(profiles) ? profiles : [...demoEmployees];
    const payrollPeople = [...payrollDemoEmployees];
    profileList.forEach(profile => {
      if (!payrollPeople.some(person => person.name.toLowerCase() === String(profile.name).toLowerCase())) {
        payrollPeople.push({ id: profile.id, name: profile.name, salary: Number(profile.salary) || 0, allowance: Number(profile.allowance) || 0 });
      }
    });

    root.querySelector('#salary-admin-stats').innerHTML = `
      <article class="stat-card"><div><small>Monthly payroll</small><strong>${money(payrollPeople.reduce((sum, person) => sum + person.salary + person.allowance, 0))}</strong></div></article>
      <article class="stat-card"><div><small>Pending advances</small><strong>${pending.length}</strong></div></article>
      <article class="stat-card"><div><small>Paid salaries</small><strong>${payrollPeople.filter(person => payrollStatus[`${monthKey}:${person.id}`]?.paidAt).length} / ${payrollPeople.length}</strong></div></article>`;

    requestList.innerHTML = requests.map(request => {
      const status = request.status || 'pending';
      const actions = status === 'pending'
        ? `<div class="salary-actions"><button class="salary-approve" type="button" data-salary-action="approve" data-request-id="${escapeEmployeeText(request.id)}">Approve</button><button class="salary-reject" type="button" data-salary-action="reject" data-request-id="${escapeEmployeeText(request.id)}">Reject</button></div>`
        : `<span class="salary-status ${status === 'approved' ? 'is-approved' : 'is-rejected'}">${status === 'approved' ? 'Approved' : 'Rejected'}</span>`;
      return `<tr><td>${escapeEmployeeText(request.employeeName || 'Employee')}</td><td>${request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-PH') : '—'}</td><td>${money(request.amount)}</td><td>${escapeEmployeeText(request.reason || '—')}</td><td>${actions}</td></tr>`;
    }).join('');
    root.querySelector('#salary-request-empty').hidden = pending.length > 0;
    if (!requests.length) requestList.innerHTML = '<tr><td colspan="5" class="salary-no-records">No salary advance requests yet.</td></tr>';

    payrollList.innerHTML = payrollPeople.map(person => {
      const advances = requests.filter(request => request.employeeName === person.name && request.status === 'approved' && String(request.approvedAt || '').slice(0, 7) === monthKey)
        .reduce((total, request) => total + Number(request.amount || 0), 0);
      const gross = Number(person.salary || 0) + Number(person.allowance || 0);
      const remaining = Math.max(0, gross - advances);
      const state = payrollStatus[`${monthKey}:${person.id}`];
      return `<tr><td><b>${escapeEmployeeText(person.name)}</b></td><td>${money(gross)}</td><td>${money(advances)}</td><td><b>${money(remaining)}</b></td><td>${state?.paidAt ? `<span class="salary-status is-approved">Paid ${new Date(state.paidAt).toLocaleDateString('en-PH')}</span>` : '<span class="salary-status is-pending">Awaiting approval</span>'}</td><td><button type="button" class="salary-pay" data-payroll-id="${escapeEmployeeText(person.id)}" ${state?.paidAt ? 'disabled' : ''}>Approve salary</button></td></tr>`;
    }).join('');
  };
  render();

  root.addEventListener('click', async event => {
    const requestButton = event.target.closest('[data-salary-action]');
    if (requestButton) {
      const requests = loadRequests();
      const request = requests.find(item => item.id === requestButton.dataset.requestId);
      if (!request || request.status !== 'pending') return;
      if (requestButton.dataset.salaryAction === 'approve' && !await confirmAdminAction(`Approve ${request.employeeName || 'this employee'}’s salary advance request for ₱${Number(request.amount || 0).toLocaleString('en-PH')}?`)) return;
      request.status = requestButton.dataset.salaryAction === 'approve' ? 'approved' : 'rejected';
      request.approvedAt = request.status === 'approved' ? new Date().toISOString() : null;
      localStorage.setItem(salaryRequestsKey, JSON.stringify(requests));
      render();
      return;
    }
    const payButton = event.target.closest('[data-payroll-id]');
    if (!payButton || payButton.disabled) return;
    const savedProfiles = readSalaryData(employeeStorageKey, []);
    const person = [...payrollDemoEmployees, ...(Array.isArray(savedProfiles) ? savedProfiles : [])].find(item => item.id === payButton.dataset.payrollId);
    if (!await confirmAdminAction(`Approve salary payment for ${person?.name || 'this employee'}?`)) return;
    const payrollStatus = loadPayrollStatus();
    payrollStatus[`${monthKey}:${payButton.dataset.payrollId}`] = { paidAt: new Date().toISOString() };
    localStorage.setItem(payrollStatusKey, JSON.stringify(payrollStatus));
    render();
  });
}

loadAdminModule('dashboard');
