/**
 * js/user-page.js — User dashboard logic
 * Matches user.html exactly: modal id="modal-booking", tbody id="my-bookings-body"
 */

const BOOKING_MODAL_ID = 'modal-booking';
let _bookingStudioId   = null;
let _bookingStudioPrice = 0;

document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  initSidebar();
  initModalOverlay(BOOKING_MODAL_ID);

  // Require user role — redirects to login if not authenticated
  const user = await requireAuth('user');
  if (!user) return;

  // Populate sidebar + topbar
  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');
  const topbarEl = document.getElementById('topbar-user-name');
  if (nameEl)   nameEl.textContent   = user.name;
  if (roleEl)   roleEl.textContent   = 'User';
  if (topbarEl) topbarEl.textContent = user.name.split(' ')[0];

  await setupLogout();

  // Load studios + filters
  await loadUserStudios();
  populateZoneFilterUser();

  document.getElementById('filter-zone')?.addEventListener('change', () => loadUserStudios());
  document.getElementById('filter-search')?.addEventListener('input', (() => {
    let t;
    return () => { clearTimeout(t); t = setTimeout(() => loadUserStudios(), 300); };
  })());

  // Load my bookings
  await loadMyBookings();

  // Init map
  try {
    const data = await Studios.getAll({ limit: 100 });
    renderLeafletMap('studio-map', data.studios);
  } catch { /* map is optional */ }

  // Booking form — hours stepper
  initHoursStepper();

  // Booking form — live cost preview
  document.getElementById('booking-hours')?.addEventListener('input', updateCostPreview);

  // Booking form — submit
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);

  // Tab nav (sidebar links switch sections)
  document.querySelectorAll('.nav-link[href]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      e.preventDefault();
      const targetId = href.slice(1);
      document.querySelectorAll('.section').forEach(s =>
        s.style.display = s.id === targetId ? '' : 'none'
      );
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (window.innerWidth < 769) document.querySelector('.sidebar')?.classList.remove('open');
    });
  });
});

// Expose for inline onclick handlers in rendered studio cards
window.openBookingModal = openBookingModal;

// ── Load Studios ──────────────────────────────────────────────────
async function loadUserStudios(page = 1) {
  const grid = document.getElementById('studios-grid');
  if (!grid) return;

  const zone   = document.getElementById('filter-zone')?.value || 'all';
  const search = document.getElementById('filter-search')?.value?.trim() || '';

  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
    <div class="empty-state-lens">LS</div><p>Loading studios...</p></div>`;

  try {
    const params = { page, limit: 6 };
    if (zone && zone !== 'all') params.zone = zone;
    if (search) params.search = search;

    const data = await Studios.getAll(params);
    renderStudiosGrid(grid, data.studios, 'user');
    renderPaginationUser(data, loadUserStudios);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-state-lens">LS</div>
      <h3>Could not load studios</h3><p>${err.message}</p></div>`;
  }
}

function populateZoneFilterUser() {
  const sel = document.getElementById('filter-zone');
  if (!sel) return;
  [
    { value: 'maadi',     label: 'Maadi' },
    { value: 'zamalek',   label: 'Zamalek' },
    { value: 'nasr-city', label: 'Nasr City' },
    { value: 'new-cairo', label: 'New Cairo' },
  ].forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    sel.appendChild(opt);
  });
}

function renderPaginationUser({ page, pages }, loadFn) {
  let container = document.getElementById('studios-pagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'studios-pagination';
    container.style.cssText = 'display:flex;justify-content:center;gap:8px;margin-top:24px;';
    document.getElementById('studios-grid')?.after(container);
  }
  container.innerHTML = '';
  if (!pages || pages <= 1) return;
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `btn btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}`;
    btn.addEventListener('click', () => loadFn(i));
    container.appendChild(btn);
  }
}

// ── Booking Modal ─────────────────────────────────────────────────
async function openBookingModal(studioId) {
  _bookingStudioId = studioId;
  try {
    const { studio } = await Studios.getOne(studioId);
    _bookingStudioPrice = studio.price || 0;

    // Set studio name in modal title
    const nameEl = document.getElementById('booking-studio-name');
    if (nameEl) nameEl.textContent = studio.name;

    // Store studioId in hidden field
    const idField = document.getElementById('booking-studio-id');
    if (idField) idField.value = studioId;

    // Set date minimum to today
    const dateInput = document.getElementById('booking-date');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

    // Update cost preview
    updateCostPreview();

    // Open modal
    openModalOverlay(BOOKING_MODAL_ID);
    document.getElementById('booking-date')?.focus();
  } catch (err) {
    toastError('Error', err.message);
  }
}

function updateCostPreview() {
  const hours  = parseInt(document.getElementById('booking-hours')?.value || '1', 10);
  const price  = _bookingStudioPrice;
  const perHrEl = document.getElementById('booking-price-per-hour');
  const totalEl = document.getElementById('booking-total-cost');
  if (perHrEl) perHrEl.textContent = `EGP ${price}`;
  if (totalEl) totalEl.textContent = `EGP ${price * hours}`;
}

function initHoursStepper() {
  const hoursInput = document.getElementById('booking-hours');
  if (!hoursInput) return;

  document.getElementById('hours-up')?.addEventListener('click', () => {
    const val = parseInt(hoursInput.value, 10);
    if (val < 12) { hoursInput.value = val + 1; updateCostPreview(); }
  });

  document.getElementById('hours-down')?.addEventListener('click', () => {
    const val = parseInt(hoursInput.value, 10);
    if (val > 1) { hoursInput.value = val - 1; updateCostPreview(); }
  });
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]') ||
              document.querySelector('button[form="booking-form"]');

  const date  = document.getElementById('booking-date')?.value;
  const hours = parseInt(document.getElementById('booking-hours')?.value || '1', 10);
  const notes = document.getElementById('booking-notes')?.value?.trim() || '';

  if (!date) { toastError('Validation', 'Please select a booking date.'); return; }
  if (!_bookingStudioId) { toastError('Error', 'No studio selected.'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Booking...'; }

  try {
    await Bookings.create({ studioId: _bookingStudioId, date, hours, notes });
    toastSuccess('Booking Sent!', 'Your request was submitted. The owner will confirm soon.');
    closeModalOverlay(BOOKING_MODAL_ID);
    e.target.reset();
    _bookingStudioId  = null;
    _bookingStudioPrice = 0;
    await loadMyBookings();
  } catch (err) {
    toastError('Booking Failed', err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Confirm Booking'; }
  }
}

// ── My Bookings ───────────────────────────────────────────────────
async function loadMyBookings() {
  const tbody = document.getElementById('my-bookings-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--sp-xl);">Loading bookings...</td></tr>`;

  try {
    const { bookings } = await Bookings.getMy();

    if (!bookings || !bookings.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--sp-xl);color:var(--clr-text-muted);">
        No bookings yet. Browse studios above and click "Book Now" to get started.
      </td></tr>`;
      return;
    }

    const statusClass = {
      pending:  'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error',
    };

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong>${b.studioId?.name || '—'}</strong></td>
        <td>${new Date(b.date).toLocaleDateString('en-GB')}</td>
        <td>${b.startTime || '—'}</td>
        <td>${b.hours} hr${b.hours > 1 ? 's' : ''}</td>
        <td><strong>EGP ${b.totalPrice}</strong></td>
        <td><span class="badge ${statusClass[b.status] || 'badge-info'}">${b.status}</span></td>
      </tr>`).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--clr-error);padding:var(--sp-md);">${err.message}</td></tr>`;
  }
}
