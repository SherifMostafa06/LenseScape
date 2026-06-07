/* =============================================================
   js/app.js — UI Interactions, DOM Manipulation, Shared Logic
   CHANGES: All emojis removed. Toast icons now use text symbols.
            Studio card image area uses text label.
            Dark mode label is text-based.
   ============================================================= */

'use strict';

/* ---------------------------------------------------------------
   INITIALIZATION
--------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  restoreDarkMode();
  createToastContainer();

  const bodyId = document.body.id;
  if (bodyId === 'page-home')  initPublicHome();
  if (bodyId === 'page-login') initLoginPage();
  if (bodyId === 'page-user')  initUserPage();
});

/* ---------------------------------------------------------------
   TOAST NOTIFICATION SYSTEM
--------------------------------------------------------------- */

function createToastContainer() {
  if (document.getElementById('toast-container')) return;
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
}

/**
 * Show a toast notification.
 * Icons are now plain text symbols (no emoji).
 */
function showToast(title, message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Text-based icons replacing emojis
  const icons = {
    success: '+',
    error:   'x',
    warning: '!',
    info:    'i',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '.'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
  `;

  container.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), duration);
  toast.addEventListener('click', () => { clearTimeout(timer); dismissToast(toast); });
}

function dismissToast(toast) {
  toast.classList.add('hiding');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

function toastSuccess(title, message) { showToast(title, message, 'success'); }
function toastError(title, message)   { showToast(title, message, 'error');   }
function toastWarning(title, message) { showToast(title, message, 'warning'); }
function toastInfo(title, message)    { showToast(title, message, 'info');    }

/* ---------------------------------------------------------------
   DARK MODE
--------------------------------------------------------------- */

function restoreDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) document.body.classList.add('dark');
  updateDarkModeButton(isDark);
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', String(isDark));
  updateDarkModeButton(isDark);
}

function updateDarkModeButton(isDark) {
  document.querySelectorAll('.dark-mode-toggle').forEach(btn => {
    btn.setAttribute('aria-checked', String(isDark));
    btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  });
  document.querySelectorAll('.dark-mode-label').forEach(el => {
    el.textContent = isDark ? 'Light' : 'Dark';
  });
}

/* ---------------------------------------------------------------
   MODAL HELPERS
--------------------------------------------------------------- */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function setupModalOverlays() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

/* ---------------------------------------------------------------
   ROUTING GUARD
--------------------------------------------------------------- */

function requireAuth(requiredRole = null) {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  if (requiredRole && user.role !== requiredRole) {
    const redirectMap = { user: 'user.html', owner: 'owner.html', admin: 'admin.html' };
    window.location.href = redirectMap[user.role] || 'login.html';
    return null;
  }
  return user;
}

function redirectIfLoggedIn() {
  const user = getCurrentUser();
  if (!user) return;
  const redirectMap = { user: 'user.html', owner: 'owner.html', admin: 'admin.html' };
  const dest = redirectMap[user.role];
  if (dest) window.location.href = dest;
}

/* ---------------------------------------------------------------
   SHARED UI SETUP (sidebar, topbar, logout, dark mode)
--------------------------------------------------------------- */

function setupSharedUI() {
  const user = getCurrentUser();
  if (!user) return;

  const userNameEl = document.getElementById('sidebar-user-name');
  if (userNameEl) userNameEl.textContent = user.name;

  const userRoleEl = document.getElementById('sidebar-user-role');
  if (userRoleEl) userRoleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutUser();
      toastInfo('Logged out', 'See you next time.');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
    });
  }

  document.querySelectorAll('.dark-mode-toggle').forEach(btn => {
    btn.addEventListener('click', toggleDarkMode);
  });

  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  // Fix 7: menu toggle with backdrop overlay
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar    = document.querySelector('.sidebar');

  // Inject backdrop element once
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
    document.body.style.overflow = '';
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Suggestion A: smooth scroll + nav highlight for hash links
  document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (window.innerWidth < 769) closeSidebar();
    });
  });

  setupModalOverlays();
}

/* ---------------------------------------------------------------
   PUBLIC HOME PAGE (index.html — no auth required)
--------------------------------------------------------------- */

function initPublicHome() {
  // Redirect already-logged-in users straight to their dashboard
  redirectIfLoggedIn();

  // Dark mode toggle
  document.querySelectorAll('.dark-mode-toggle').forEach(btn => {
    btn.addEventListener('click', toggleDarkMode);
  });

  renderStudiosPublic();
  populateZoneFilterPublic();

  const zoneFilter   = document.getElementById('filter-zone');
  const searchFilter = document.getElementById('filter-search');
  if (zoneFilter)   zoneFilter.addEventListener('change', renderStudiosPublic);
  if (searchFilter) searchFilter.addEventListener('input',  renderStudiosPublic);

  // Suggestion E: animated counters
  initCounters();

  // Suggestion F: back to top
  initBackToTop();

  // Fix 4: Leaflet map (loaded after studios are rendered)
  initStudioMap('studio-map');
}

function renderStudiosPublic() {
  const container = document.getElementById('studios-grid');
  if (!container) return;

  const zoneFilter   = document.getElementById('filter-zone');
  const searchFilter = document.getElementById('filter-search');
  const selectedZone = zoneFilter   ? zoneFilter.value : 'all';
  const searchQuery  = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

  let studios = getStudios().filter(s => s.available);
  if (selectedZone !== 'all') studios = studios.filter(s => s.zone === selectedZone);
  if (searchQuery) {
    studios = studios.filter(s =>
      s.name.toLowerCase().includes(searchQuery) ||
      s.description.toLowerCase().includes(searchQuery) ||
      s.zone.toLowerCase().includes(searchQuery) ||
      (s.features || []).some(f => f.toLowerCase().includes(searchQuery))
    );
  }

  container.innerHTML = '';

  if (studios.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">LS</div>
        <h3>No Studios Found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>
    `;
    return;
  }

  studios.forEach(studio => {
    const card = createStudioCardPublic(studio);
    container.appendChild(card);
  });
}

/**
 * Studio card for the public home page.
 * "Book Now" always redirects to login.html because the visitor
 * is not authenticated. The target studio id is stored in
 * sessionStorage so after login the user dashboard can pre-select it.
 */
function createStudioCardPublic(studio) {
  const card = document.createElement('div');
  card.className = 'card studio-card';
  card.dataset.studioId = studio.id; // for nearest badge targeting

  const featuresHtml = (studio.features || [])
    .slice(0, 3)
    .map(f => `<span class="badge badge-info">${f}</span>`)
    .join('');

  const zoneLabels = { 'maadi': 'Maadi', 'zamalek': 'Zamalek', 'nasr-city': 'Nasr City', 'new-cairo': 'New Cairo' };
  const zoneLabel  = zoneLabels[studio.zone] || (studio.zone.charAt(0).toUpperCase() + studio.zone.slice(1));
  const zoneClass  = `zone-${studio.zone}`;

  card.innerHTML = `
    <div class="studio-card-image ${zoneClass}">Studio</div>
    <div class="studio-card-body">
      <h3 class="studio-card-name">${studio.name}</h3>
      <div class="studio-card-meta">
        <span>Zone: ${zoneLabel}</span>
        <span>Capacity: ${studio.capacity}</span>
      </div>
      <p style="font-size:0.85rem; margin-bottom:var(--sp-sm);">${studio.description}</p>
      <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:var(--sp-md);">
        ${featuresHtml}
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <span class="studio-price">
          ${formatCurrency(studio.price)}
          <span style="font-size:0.7rem; font-weight:400; color:var(--clr-text-muted);">/hr</span>
        </span>
        <button class="btn btn-primary btn-sm" onclick="handlePublicBookNow('${studio.id}')">
          Book Now
        </button>
      </div>
    </div>
  `;
  return card;
}

/**
 * Called when a guest clicks "Book Now" on the public home.
 * Saves the intended studio to sessionStorage, then sends the
 * visitor to the login page.
 */
function handlePublicBookNow(studioId) {
  try { sessionStorage.setItem('pendingStudioId', studioId); } catch (e) {}
  toastInfo('Sign in to book', 'Create a free account or sign in to reserve this studio.');
  setTimeout(() => { window.location.href = 'login.html'; }, 1200);
}

function populateZoneFilterPublic() {
  const zoneSelect = document.getElementById('filter-zone');
  if (!zoneSelect) return;
  const zoneLabels = { 'maadi': 'Maadi', 'zamalek': 'Zamalek', 'nasr-city': 'Nasr City', 'new-cairo': 'New Cairo' };
  const zones = [...new Set(getStudios().map(s => s.zone))].sort();
  zones.forEach(zone => {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zoneLabels[zone] || (zone.charAt(0).toUpperCase() + zone.slice(1));
    zoneSelect.appendChild(option);
  });
}

/* ---------------------------------------------------------------
   LOGIN PAGE
--------------------------------------------------------------- */

function initLoginPage() {
  redirectIfLoggedIn();

  // Tab switching
  const tabs   = document.querySelectorAll('.auth-tab');
  const panels = document.querySelectorAll('.auth-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.toggle('active', p.id === `panel-${target}`));
      panels.forEach(p => clearAllErrors(p));
    });
  });

  // Dark mode toggle on login page
  document.querySelectorAll('.dark-mode-toggle').forEach(btn => {
    btn.addEventListener('click', toggleDarkMode);
  });

  // Fix 6: Password error specificity — check format on login too
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      const { valid, errors } = validateLoginForm({ email, password });
      if (!valid) {
        applyFormErrors(loginForm, errors);
        // Show specific first error in toast
        const firstMsg = Object.values(errors)[0] || 'Please fix the highlighted fields.';
        toastError('Validation Error', firstMsg);
        return;
      }

      const user = loginUser(email, password);
      if (!user) {
        toastError('Login Failed', 'Incorrect email or password. Please try again.');
        showFieldError(document.getElementById('login-email'), 'No account found with this email and password combination.');
        return;
      }

      toastSuccess('Welcome back!', `Signed in as ${user.name}`);
      const redirectMap = { user: 'user.html', owner: 'owner.html', admin: 'admin.html' };
      setTimeout(() => { window.location.href = redirectMap[user.role] || 'index.html'; }, 900);
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = document.getElementById('reg-name').value;
      const email   = document.getElementById('reg-email').value;
      const password= document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;
      const roleInput = registerForm.querySelector('input[name="role"]:checked');
      const role    = roleInput ? roleInput.value : '';

      const { valid, errors } = validateRegisterForm({ name, email, password, confirmPassword: confirm, role });
      if (!valid) {
        applyFormErrors(registerForm, errors);
        const firstMsg = Object.values(errors)[0] || 'Please fix the highlighted fields.';
        toastError('Registration Error', firstMsg);
        return;
      }

      if (getUserByEmail(email)) {
        showFieldError(document.getElementById('reg-email'), 'An account with this email already exists.');
        toastError('Email Taken', 'Please use a different email address.');
        return;
      }

      createUser({ name, email, password, role });
      toastSuccess('Account Created', 'You can now sign in with your credentials.');

      const loginTab = document.querySelector('[data-tab="login"]');
      if (loginTab) loginTab.click();

      const loginEmailInput = document.getElementById('login-email');
      if (loginEmailInput) loginEmailInput.value = email;

      registerForm.reset();
      clearAllErrors(registerForm);
      updatePasswordStrength(''); // reset strength bar
    });
  }

  // Password visibility toggle
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.password-wrapper');
      const input   = wrapper.querySelector('input');
      const isPassword = input.type === 'password';
      input.type   = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? 'Hide' : 'Show';
    });
  });

  // Suggestion C: Password strength indicator
  const regPwInput = document.getElementById('reg-password');
  if (regPwInput) {
    regPwInput.addEventListener('input', () => updatePasswordStrength(regPwInput.value));
  }
}

/* ---------------------------------------------------------------
   USER PAGE
--------------------------------------------------------------- */

function initUserPage() {
  const user = requireAuth('user');
  if (!user) return;

  setupSharedUI();

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = 'Browse Studios';

  renderStudios();
  renderMyBookings();
  populateZoneFilter();

  const zoneFilter   = document.getElementById('filter-zone');
  const searchFilter = document.getElementById('filter-search');
  if (zoneFilter)   zoneFilter.addEventListener('change', renderStudios);
  if (searchFilter) searchFilter.addEventListener('input', renderStudios);

  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const studioId  = document.getElementById('booking-studio-id').value;
      const date      = document.getElementById('booking-date').value;
      const startTime = document.getElementById('booking-time').value;
      const hours     = document.getElementById('booking-hours').value;
      const notes     = document.getElementById('booking-notes').value;

      const { valid, errors } = validateBookingForm({ studioId, date, startTime, hours });
      if (!valid) {
        applyFormErrors(bookingForm, errors);
        toastError('Booking Error', 'Please fix the highlighted fields.');
        return;
      }

      createBooking({ studioId, userId: user.id, userName: user.name, date, startTime, hours, notes });
      toastSuccess('Studio Booked', 'Your booking is pending owner approval.');
      closeModal('modal-booking');
      bookingForm.reset();
      clearAllErrors(bookingForm);
      renderMyBookings();
    });
  }

  // Hours +/- buttons
  const hoursInput = document.getElementById('booking-hours');
  const hoursUp    = document.getElementById('hours-up');
  const hoursDown  = document.getElementById('hours-down');
  if (hoursUp && hoursDown && hoursInput) {
    hoursUp.addEventListener('click', () => {
      const val = parseInt(hoursInput.value, 10) || 1;
      if (val < 12) hoursInput.value = val + 1;
      updateCostPreview();
    });
    hoursDown.addEventListener('click', () => {
      const val = parseInt(hoursInput.value, 10) || 1;
      if (val > 1) hoursInput.value = val - 1;
      updateCostPreview();
    });
    hoursInput.addEventListener('input', updateCostPreview);
  }

  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Fix 4: Map in user dashboard
  initStudioMap('studio-map');
}

/* ---------------------------------------------------------------
   RENDER: STUDIO CARDS (no emojis)
--------------------------------------------------------------- */

function renderStudios() {
  const container = document.getElementById('studios-grid');
  if (!container) return;

  const zoneFilter   = document.getElementById('filter-zone');
  const searchFilter = document.getElementById('filter-search');
  const selectedZone = zoneFilter   ? zoneFilter.value : 'all';
  const searchQuery  = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

  let studios = getStudios().filter(s => s.available);
  if (selectedZone !== 'all') studios = studios.filter(s => s.zone === selectedZone);
  if (searchQuery) {
    studios = studios.filter(s =>
      s.name.toLowerCase().includes(searchQuery) ||
      s.description.toLowerCase().includes(searchQuery) ||
      s.zone.toLowerCase().includes(searchQuery)
    );
  }

  container.innerHTML = '';

  if (studios.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">LS</div>
        <h3>No Studios Found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>
    `;
    return;
  }

  studios.forEach(studio => {
    const card = createStudioCard(studio);
    container.appendChild(card);
  });
}

function createStudioCard(studio) {
  const card = document.createElement('div');
  card.className = 'card studio-card';
  card.dataset.studioId = studio.id; // for nearest badge targeting

  const featuresHtml = (studio.features || [])
    .slice(0, 3)
    .map(f => `<span class="badge badge-info">${f}</span>`)
    .join('');

  const zoneLabels = { 'maadi': 'Maadi', 'zamalek': 'Zamalek', 'nasr-city': 'Nasr City', 'new-cairo': 'New Cairo' };
  const zoneLabel  = zoneLabels[studio.zone] || (studio.zone.charAt(0).toUpperCase() + studio.zone.slice(1));
  const zoneClass  = `zone-${studio.zone}`;

  card.innerHTML = `
    <div class="studio-card-image ${zoneClass}">Studio</div>
    <div class="studio-card-body">
      <h3 class="studio-card-name">${studio.name}</h3>
      <div class="studio-card-meta">
        <span>Zone: ${zoneLabel}</span>
        <span>Capacity: ${studio.capacity}</span>
      </div>
      <p style="font-size:0.85rem; margin-bottom:var(--sp-sm);">${studio.description}</p>
      <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:var(--sp-md);">
        ${featuresHtml}
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <span class="studio-price">
          ${formatCurrency(studio.price)}
          <span style="font-size:0.7rem; font-weight:400; color:var(--clr-text-muted);">/hr</span>
        </span>
        <button class="btn btn-primary btn-sm" onclick="openBookingModal('${studio.id}')">
          Book Now
        </button>
      </div>
    </div>
  `;
  return card;
}

function openBookingModal(studioId) {
  const studio = getStudioById(studioId);
  if (!studio) return;

  document.getElementById('booking-studio-id').value = studioId;

  const nameEl = document.getElementById('booking-studio-name');
  if (nameEl) nameEl.textContent = studio.name;

  const priceEl = document.getElementById('booking-price-per-hour');
  if (priceEl) priceEl.textContent = formatCurrency(studio.price);

  const hoursInput = document.getElementById('booking-hours');
  if (hoursInput) hoursInput.value = 1;

  updateCostPreview();
  clearAllErrors(document.getElementById('booking-form'));
  openModal('modal-booking');
}

function updateCostPreview() {
  const studioId = document.getElementById('booking-studio-id').value;
  const hours    = parseInt(document.getElementById('booking-hours').value, 10) || 1;
  const studio   = getStudioById(studioId);
  if (!studio) return;
  const costEl = document.getElementById('booking-total-cost');
  if (costEl) costEl.textContent = formatCurrency(studio.price * hours);
}

/* ---------------------------------------------------------------
   RENDER: MY BOOKINGS TABLE
--------------------------------------------------------------- */

function renderMyBookings() {
  const container = document.getElementById('my-bookings-body');
  if (!container) return;

  const user     = getCurrentUser();
  const bookings = getBookingsByUser(user.id);
  container.innerHTML = '';

  if (bookings.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:var(--sp-xl); color:var(--clr-text-muted);">
          You have no bookings yet. Browse studios above to make your first booking.
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  sorted.forEach(booking => {
    const statusClass = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[booking.status] || 'badge-info';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${booking.studioName}</strong></td>
      <td>${formatDate(booking.date)}</td>
      <td>${booking.startTime}</td>
      <td>${booking.hours} hr${booking.hours > 1 ? 's' : ''}</td>
      <td>${formatCurrency(booking.totalCost)}</td>
      <td><span class="badge ${statusClass}">${booking.status}</span></td>
    `;
    container.appendChild(row);
  });
}

/* ---------------------------------------------------------------
   ZONE FILTER POPULATION
--------------------------------------------------------------- */

function populateZoneFilter() {
  const zoneSelect = document.getElementById('filter-zone');
  if (!zoneSelect) return;
  const zoneLabels = { 'maadi': 'Maadi', 'zamalek': 'Zamalek', 'nasr-city': 'Nasr City', 'new-cairo': 'New Cairo' };
  const zones = [...new Set(getStudios().map(s => s.zone))].sort();
  zones.forEach(zone => {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zoneLabels[zone] || (zone.charAt(0).toUpperCase() + zone.slice(1));
    zoneSelect.appendChild(option);
  });
}

/* ---------------------------------------------------------------
   SUGGESTION C: PASSWORD STRENGTH INDICATOR
--------------------------------------------------------------- */
function updatePasswordStrength(password) {
  const fill  = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!fill || !label) return;

  if (!password) {
    fill.className = 'pw-strength-fill'; fill.style.width = '0%';
    label.className = 'pw-strength-label'; label.textContent = '';
    return;
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = ['', 'weak', 'fair', 'strong'];
  const labels = { weak: 'Weak', fair: 'Fair', strong: 'Strong' };
  const level = score <= 1 ? 'weak' : score <= 2 ? 'fair' : 'strong';

  fill.className  = `pw-strength-fill ${level}`;
  label.className = `pw-strength-label ${level}`;
  label.textContent = labels[level];
}

/* ---------------------------------------------------------------
   SUGGESTION E: ANIMATED COUNTER
--------------------------------------------------------------- */
function animateCounter(el, target, duration = 1500) {
  const start    = performance.now();
  const startVal = 0;
  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(startVal + ease * (target - startVal)) + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target, parseInt(entry.target.dataset.count, 10));
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------------
   SUGGESTION F: BACK TO TOP
--------------------------------------------------------------- */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------------------------------------------------------------
   FIX 4: LEAFLET MAP
--------------------------------------------------------------- */
function initStudioMap(containerId) {
  const mapEl = document.getElementById(containerId);
  if (!mapEl || typeof L === 'undefined') return;

  const studios = getStudios().filter(s => s.available && s.lat && s.lng);
  if (!studios.length) return;

  // Centre on Cairo
  const map = L.map(containerId, { zoomControl: true }).setView([30.0444, 31.2357], 11);

  // OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  const zoneColors = { 'maadi': '#2d7a4f', 'zamalek': '#6b35a8', 'nasr-city': '#1a5fa0', 'new-cairo': '#c8833a' };
  const zoneLabels = { 'maadi': 'Maadi', 'zamalek': 'Zamalek', 'nasr-city': 'Nasr City', 'new-cairo': 'New Cairo' };

  const markers = {};

  studios.forEach(studio => {
    const color = zoneColors[studio.zone] || '#c8833a';
    const icon  = L.divIcon({
      className: '',
      html: `<div style="
        width:32px; height:32px; border-radius:50%;
        background:${color}; border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
        color:#fff; font-weight:700; font-size:11px;
        font-family:Georgia,serif;
      ">LS</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const marker = L.marker([studio.lat, studio.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="min-width:180px;">
          <strong style="font-size:0.95rem;">${studio.name}</strong><br/>
          <span style="font-size:0.78rem; color:#6b6560;">${zoneLabels[studio.zone] || studio.zone}</span><br/>
          <span style="font-size:0.82rem; font-weight:600; color:${color};">${formatCurrency(studio.price)}/hr</span><br/>
          <span style="font-size:0.75rem; color:#6b6560;">Capacity: ${studio.capacity}</span>
        </div>
      `);
    markers[studio.id] = marker;
  });

  // Geolocation: find nearest studio
  const statusEl  = document.getElementById('map-location-status-text');
  const dotEl     = document.getElementById('map-location-dot');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        // Haversine distance
        function haversine(lat1, lng1, lat2, lng2) {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        }

        let nearest = null, minDist = Infinity;
        studios.forEach(s => {
          const d = haversine(userLat, userLng, s.lat, s.lng);
          if (d < minDist) { minDist = d; nearest = s; }
        });

        // User location marker
        const userIcon = L.divIcon({
          className: '',
          html: `<div style="
            width:16px; height:16px; border-radius:50%;
            background:#2d7a4f; border:3px solid #fff;
            box-shadow:0 0 0 4px rgba(45,122,79,0.3);
          "></div>`,
          iconSize: [16,16], iconAnchor: [8,8],
        });
        L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<strong>You are here</strong>');

        if (nearest && markers[nearest.id]) {
          markers[nearest.id].openPopup();
          if (dotEl)    { dotEl.classList.add('active'); }
          if (statusEl) { statusEl.textContent = `Nearest: ${nearest.name} (~${minDist.toFixed(1)} km)`; }

          // Highlight nearest studio cards
          document.querySelectorAll(`.nearest-badge`).forEach(b => b.remove());
          document.querySelectorAll(`[data-studio-id="${nearest.id}"]`).forEach(card => {
            const imgEl = card.querySelector('.studio-card-image');
            if (imgEl) {
              const badge = document.createElement('span');
              badge.className = 'nearest-badge';
              badge.textContent = 'Nearest to You';
              imgEl.appendChild(badge);
            }
          });
        }
      },
      () => {
        if (statusEl) statusEl.textContent = 'Location not available';
      }
    );
  } else {
    if (statusEl) statusEl.textContent = 'Geolocation not supported';
  }

  return map;
}
