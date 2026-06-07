/* =============================================================
   js/owner.js — Studio Owner Dashboard Logic
   CHANGES: All emojis removed from dynamically generated HTML.
   ============================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('owner');
  if (!user) return;

  setupSharedUI();

  const el = document.getElementById('topbar-user-name');
  if (el) el.textContent = user.name;

  renderOwnerStats();
  renderOwnerStudios();
  renderOwnerBookings();

  document.getElementById('btn-add-studio').addEventListener('click', () => {
    openAddStudioModal();
  });

  document.getElementById('studio-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleStudioFormSubmit();
  });

  const availableToggle = document.getElementById('studio-available');
  const availableLabel  = document.getElementById('available-label');
  if (availableToggle && availableLabel) {
    availableToggle.addEventListener('change', () => {
      availableLabel.textContent = availableToggle.checked ? 'Available for booking' : 'Not available';
    });
  }
});

/* ---------------------------------------------------------------
   STATS
--------------------------------------------------------------- */

function renderOwnerStats() {
  const user     = getCurrentUser();
  const studios  = getStudiosByOwner(user.id);
  const bookings = getBookingsByOwner(user.id);
  const pending  = bookings.filter(b => b.status === 'pending').length;
  const approved = bookings.filter(b => b.status === 'approved').length;

  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <span class="stat-number">${studios.length}</span>
      <span class="stat-label">My Studios</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${bookings.length}</span>
      <span class="stat-label">Total Bookings</span>
    </div>
    <div class="stat-card">
      <span class="stat-number" style="color:var(--clr-pending)">${pending}</span>
      <span class="stat-label">Pending Review</span>
    </div>
    <div class="stat-card">
      <span class="stat-number" style="color:var(--clr-approved)">${approved}</span>
      <span class="stat-label">Approved</span>
    </div>
  `;
}

/* ---------------------------------------------------------------
   STUDIOS TABLE
--------------------------------------------------------------- */

function renderOwnerStudios() {
  const user    = getCurrentUser();
  const studios = getStudiosByOwner(user.id);
  const tbody   = document.getElementById('studios-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (studios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:var(--sp-xl); color:var(--clr-text-muted);">
          You have not added any studios yet. Click "+ Add Studio" to get started.
        </td>
      </tr>
    `;
    return;
  }

  studios.forEach(studio => {
    const zoneLabel  = studio.zone.charAt(0).toUpperCase() + studio.zone.slice(1);
    const availBadge = studio.available
      ? `<span class="badge badge-approved">Available</span>`
      : `<span class="badge badge-rejected">Unavailable</span>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${studio.name}</strong></td>
      <td>${zoneLabel}</td>
      <td>${formatCurrency(studio.price)}</td>
      <td>${studio.capacity} people</td>
      <td>${availBadge}</td>
      <td>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="openEditStudioModal('${studio.id}')">Edit</button>
          <button class="btn btn-danger btn-sm"    onclick="handleDeleteStudio('${studio.id}')">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* ---------------------------------------------------------------
   ADD / EDIT MODAL
--------------------------------------------------------------- */

function openAddStudioModal() {
  document.getElementById('studio-id').value = '';
  document.getElementById('studio-form').reset();
  clearAllErrors(document.getElementById('studio-form'));
  document.getElementById('modal-studio-title').textContent = 'Add New Studio';
  document.getElementById('studio-submit-btn').textContent  = 'Add Studio';
  openModal('modal-studio');
}

function openEditStudioModal(studioId) {
  const studio = getStudioById(studioId);
  if (!studio) return;

  document.getElementById('studio-id').value          = studioId;
  document.getElementById('studio-name').value        = studio.name;
  document.getElementById('studio-zone').value        = studio.zone;
  document.getElementById('studio-price').value       = studio.price;
  document.getElementById('studio-capacity').value    = studio.capacity;
  document.getElementById('studio-description').value = studio.description;
  document.getElementById('studio-features').value    = (studio.features || []).join(', ');
  document.getElementById('studio-available').checked = studio.available;

  const availableLabel = document.getElementById('available-label');
  if (availableLabel) availableLabel.textContent = studio.available ? 'Available for booking' : 'Not available';

  clearAllErrors(document.getElementById('studio-form'));
  document.getElementById('modal-studio-title').textContent = `Edit: ${studio.name}`;
  document.getElementById('studio-submit-btn').textContent  = 'Save Changes';
  openModal('modal-studio');
}

function handleStudioFormSubmit() {
  const form        = document.getElementById('studio-form');
  const studioId    = document.getElementById('studio-id').value;
  const name        = document.getElementById('studio-name').value;
  const zone        = document.getElementById('studio-zone').value;
  const price       = document.getElementById('studio-price').value;
  const capacity    = document.getElementById('studio-capacity').value;
  const description = document.getElementById('studio-description').value;
  const featuresRaw = document.getElementById('studio-features').value;
  const available   = document.getElementById('studio-available').checked;
  const features    = featuresRaw.split(',').map(f => f.trim()).filter(f => f.length > 0);

  const { valid, errors } = validateStudioForm({ name, zone, price, capacity, description });
  if (!valid) {
    applyFormErrors(form, errors);
    toastError('Validation Error', 'Please fix the highlighted fields.');
    return;
  }

  const user = getCurrentUser();

  if (studioId) {
    updateStudio(studioId, { name, zone, price: parseFloat(price), capacity: parseInt(capacity, 10), description, features, available });
    toastSuccess('Studio Updated', `"${name}" has been saved.`);
  } else {
    createStudio({ name, zone, price, capacity, description, features, ownerId: user.id });
    toastSuccess('Studio Added', `"${name}" is now listed.`);
  }

  closeModal('modal-studio');
  renderOwnerStudios();
  renderOwnerStats();
  form.reset();
}

function handleDeleteStudio(studioId) {
  const studio = getStudioById(studioId);
  if (!studio) return;
  if (!confirm(`Delete "${studio.name}"? This will also cancel all its bookings.`)) return;

  deleteStudio(studioId);
  toastSuccess('Studio Deleted', `"${studio.name}" has been removed.`);
  renderOwnerStudios();
  renderOwnerBookings();
  renderOwnerStats();
}

/* ---------------------------------------------------------------
   BOOKINGS TABLE
--------------------------------------------------------------- */

function renderOwnerBookings() {
  const user     = getCurrentUser();
  const bookings = getBookingsByOwner(user.id);
  const tbody    = document.getElementById('bookings-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:var(--sp-xl); color:var(--clr-text-muted);">
          No booking requests yet.
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...bookings].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(a.date) - new Date(b.date);
  });

  sorted.forEach(booking => {
    const statusClass = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[booking.status];

    // Approve/Reject buttons only shown for pending bookings
    const actionButtons = booking.status === 'pending'
      ? `<div class="flex gap-sm">
           <button class="btn btn-primary btn-sm" onclick="handleBookingAction('${booking.id}', 'approved')">Approve</button>
           <button class="btn btn-danger btn-sm"  onclick="handleBookingAction('${booking.id}', 'rejected')">Reject</button>
         </div>`
      : `<span style="font-size:0.8rem; color:var(--clr-text-muted);">—</span>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${booking.studioName}</strong></td>
      <td>${booking.userName}</td>
      <td>${formatDate(booking.date)}</td>
      <td>${booking.startTime}</td>
      <td>${booking.hours} hr${booking.hours > 1 ? 's' : ''}</td>
      <td>${formatCurrency(booking.totalCost)}</td>
      <td><span class="badge ${statusClass}">${booking.status}</span></td>
      <td>${actionButtons}</td>
    `;
    tbody.appendChild(row);
  });
}

function handleBookingAction(bookingId, action) {
  const updated = updateBookingStatus(bookingId, action);
  if (!updated) return;

  if (action === 'approved') {
    toastSuccess('Booking Approved', `Booking for "${updated.studioName}" approved.`);
  } else {
    toastWarning('Booking Rejected', `Booking for "${updated.studioName}" rejected.`);
  }

  renderOwnerBookings();
  renderOwnerStats();
}
