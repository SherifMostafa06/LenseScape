/**
 * js/owner-page.js — Studio owner dashboard (matches owner.html)
 * Uses ZONE_LABELS from ui-helpers.js (loaded before this file).
 */

const STUDIO_MODAL_ID = 'modal-studio';

// Wire controls immediately (sync) so clicks work even if API calls are slow
document.addEventListener('DOMContentLoaded', () => {
  initModalOverlay(STUDIO_MODAL_ID);

  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-add-studio')) {
      e.preventDefault();
      openAddStudioModal();
    }
  });

  const form = document.getElementById('studio-form');
  if (form) {
    form.addEventListener('submit', handleStudioFormSubmit);
  }

  const availableToggle = document.getElementById('studio-available');
  const availableLabel  = document.getElementById('available-label');
  if (availableToggle && availableLabel) {
    availableToggle.addEventListener('change', () => {
      availableLabel.textContent = availableToggle.checked
        ? 'Available for booking'
        : 'Not available';
    });
  }

  initOwnerDashboard();
});

// Expose for inline handlers / table action buttons
window.openAddStudioModal   = openAddStudioModal;
window.openEditStudioModal  = openEditStudioModal;
window.deleteStudio         = deleteStudio;
window.handleBookingStatus  = handleBookingStatus;

async function initOwnerDashboard() {
  initDarkMode();
  initSidebar();

  const user = await requireAuth('owner', 'admin');
  if (!user) return;

  const firstName = getFirstName(user);
  const sidebarName = document.getElementById('sidebar-user-name');
  const topbarName  = document.getElementById('topbar-user-name');
  if (sidebarName) sidebarName.textContent = user.name || firstName;
  if (topbarName)  topbarName.textContent  = firstName;

  await setupLogout();

  try {
    await refreshOwnerDashboard();
  } catch (err) {
    toastError('Dashboard Error', err.message || 'Could not load dashboard data.');
  }
}

function getFirstName(user) {
  const full = (user?.name || '').trim();
  if (!full) return 'Owner';
  return full.split(/\s+/)[0];
}

function openAddStudioModal() {
  try {
    const form = document.getElementById('studio-form');
    form?.reset();

    const idField = document.getElementById('studio-id');
    if (idField) idField.value = '';

    const available = document.getElementById('studio-available');
    if (available) available.checked = true;

    const label = document.getElementById('available-label');
    if (label) label.textContent = 'Available for booking';

    const title = document.getElementById('modal-studio-title');
    if (title) title.textContent = 'Add Studio';

    const submitBtn = document.getElementById('studio-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Add Studio';

    if (!openModalOverlay(STUDIO_MODAL_ID)) {
      toastError('Error', 'Studio form could not be opened. Please refresh the page.');
      return;
    }

    document.getElementById('studio-name')?.focus();
  } catch (err) {
    console.error('openAddStudioModal:', err);
    toastError('Error', err.message || 'Could not open the studio form.');
  }
}

async function openEditStudioModal(studioId) {
  try {
    const { studio } = await Studios.getOne(studioId);
    const idField = document.getElementById('studio-id');
    if (idField) idField.value = studio._id;

    document.getElementById('studio-name').value        = studio.name;
    document.getElementById('studio-zone').value        = studio.zone;
    document.getElementById('studio-price').value       = studio.price;
    document.getElementById('studio-capacity').value    = studio.capacity;
    document.getElementById('studio-description').value = studio.description;
    document.getElementById('studio-features').value    = (studio.features || []).join(', ');

    const available = document.getElementById('studio-available');
    if (available) available.checked = studio.available !== false;

    const label = document.getElementById('available-label');
    if (label) {
      label.textContent = studio.available
        ? 'Available for booking'
        : 'Not available';
    }

    document.getElementById('modal-studio-title').textContent = `Edit: ${studio.name}`;
    document.getElementById('studio-submit-btn').textContent = 'Save Changes';

    if (!openModalOverlay(STUDIO_MODAL_ID)) {
      toastError('Error', 'Studio form could not be opened.');
    }
  } catch (err) {
    toastError('Error', err.message);
  }
}

async function handleStudioFormSubmit(e) {
  e.preventDefault();

  const form     = document.getElementById('studio-form');
  const studioId = document.getElementById('studio-id')?.value?.trim() || '';
  const btn      = document.getElementById('studio-submit-btn');
  if (!form || !btn) return;

  const name = document.getElementById('studio-name')?.value?.trim();
  const zone = document.getElementById('studio-zone')?.value;
  const price = document.getElementById('studio-price')?.value;
  const capacity = document.getElementById('studio-capacity')?.value;
  const description = document.getElementById('studio-description')?.value?.trim();

  if (!name || !zone || !price || !capacity || !description) {
    toastError('Validation', 'Please fill in all required fields (name, zone, price, capacity, description).');
    return;
  }

  if (description.length < 10) {
    toastError('Validation', 'Description must be at least 10 characters.');
    return;
  }

  btn.disabled = true;
  btn.textContent = studioId ? 'Saving...' : 'Creating...';

  try {
    const formData = new FormData(form);
    const featuresRaw = formData.get('features') || '';
    formData.set(
      'features',
      JSON.stringify(
        String(featuresRaw)
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
      )
    );
    formData.set(
      'available',
      document.getElementById('studio-available')?.checked ? 'true' : 'false'
    );

    if (studioId) {
      await Studios.update(studioId, formData);
      toastSuccess('Studio Updated', 'Your changes have been saved.');
    } else {
      await Studios.create(formData);
      toastSuccess('Studio Added', 'Your new studio is now listed.');
    }

    closeModalOverlay(STUDIO_MODAL_ID);
    form.reset();
    const idField = document.getElementById('studio-id');
    if (idField) idField.value = '';
    await refreshOwnerDashboard();
  } catch (err) {
    toastError('Failed', err.message || 'Could not save studio.');
  } finally {
    btn.disabled = false;
    btn.textContent = studioId ? 'Save Changes' : 'Add Studio';
  }
}

async function refreshOwnerDashboard() {
  await Promise.all([
    loadOwnerStats(),
    loadMyStudiosTable(),
    loadOwnerBookingsTable(),
  ]);
}

async function loadOwnerStats() {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  try {
    const [{ studios }, { bookings }] = await Promise.all([
      Studios.getMy(),
      Bookings.getOwner(),
    ]);
    const pending  = bookings.filter((b) => b.status === 'pending').length;
    const approved = bookings.filter((b) => b.status === 'approved').length;

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
      </div>`;
  } catch {
    grid.innerHTML = '';
  }
}

async function loadMyStudiosTable() {
  const tbody = document.getElementById('studios-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--sp-xl);">Loading...</td></tr>`;

  try {
    const { studios } = await Studios.getMy();

    if (!studios.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:var(--sp-xl);color:var(--clr-text-muted);">
            You have not added any studios yet. Click "+ Add Studio" to get started.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = studios
      .map((studio) => {
        const zone = ZONE_LABELS[studio.zone] || studio.zone;
        const avail = studio.available
          ? '<span class="badge badge-success">Available</span>'
          : '<span class="badge badge-error">Unavailable</span>';
        return `
          <tr>
            <td><strong>${studio.name}</strong></td>
            <td>${zone}</td>
            <td>EGP ${studio.price}</td>
            <td>${studio.capacity} people</td>
            <td>${avail}</td>
            <td>
              <div class="flex gap-sm">
                <button type="button" class="btn btn-secondary btn-sm" onclick="openEditStudioModal('${studio._id}')">Edit</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="deleteStudio('${studio._id}')">Delete</button>
              </div>
            </td>
          </tr>`;
      })
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--clr-error);padding:var(--sp-md);">${err.message}</td></tr>`;
  }
}

async function loadOwnerBookingsTable() {
  const tbody = document.getElementById('bookings-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:var(--sp-xl);">Loading...</td></tr>`;

  try {
    const { bookings } = await Bookings.getOwner();

    if (!bookings.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:var(--sp-xl);color:var(--clr-text-muted);">
            No booking requests yet.
          </td>
        </tr>`;
      return;
    }

    const statusClass = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error',
    };

    const sorted = [...bookings].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(a.date) - new Date(b.date);
    });

    tbody.innerHTML = sorted
      .map((b) => {
        const actions =
          b.status === 'pending'
            ? `<div class="flex gap-sm">
                 <button type="button" class="btn btn-primary btn-sm" onclick="handleBookingStatus('${b._id}','approved')">Approve</button>
                 <button type="button" class="btn btn-danger btn-sm" onclick="handleBookingStatus('${b._id}','rejected')">Reject</button>
               </div>`
            : '<span style="font-size:0.8rem;color:var(--clr-text-muted);">—</span>';

        return `
          <tr>
            <td><strong>${b.studioId?.name || '—'}</strong></td>
            <td>${b.userId?.name || '—'}</td>
            <td>${new Date(b.date).toLocaleDateString('en-GB')}</td>
            <td>—</td>
            <td>${b.hours} hr${b.hours > 1 ? 's' : ''}</td>
            <td>EGP ${b.totalPrice}</td>
            <td><span class="badge ${statusClass[b.status] || 'badge-info'}">${b.status}</span></td>
            <td>${actions}</td>
          </tr>`;
      })
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--clr-error);padding:var(--sp-md);">${err.message}</td></tr>`;
  }
}

async function deleteStudio(studioId) {
  if (!confirm('Are you sure you want to delete this studio? This cannot be undone.')) return;
  try {
    await Studios.delete(studioId);
    toastSuccess('Deleted', 'Studio has been removed.');
    await refreshOwnerDashboard();
  } catch (err) {
    toastError('Error', err.message);
  }
}

async function handleBookingStatus(bookingId, status) {
  try {
    await Bookings.updateStatus(bookingId, status);
    toastSuccess('Updated', `Booking ${status} successfully.`);
    await refreshOwnerDashboard();
  } catch (err) {
    toastError('Error', err.message);
  }
}
