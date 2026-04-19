/* =============================================================
   js/admin.js — Admin Dashboard Logic
   CHANGES: All emojis removed from dynamically generated HTML.
   ============================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('admin');
  if (!user) return;

  setupSharedUI();

  const el = document.getElementById('topbar-user-name');
  if (el) el.textContent = user.name;

  renderAdminStats();
  renderAdminUsers();
  renderAdminStudios();
  renderAdminBookings();

  document.getElementById('search-users')
    .addEventListener('input', (e) => renderAdminUsers(e.target.value));
  document.getElementById('search-studios')
    .addEventListener('input', (e) => renderAdminStudios(e.target.value));
  document.getElementById('search-bookings')
    .addEventListener('input', (e) => renderAdminBookings(e.target.value));
});

/* ---------------------------------------------------------------
   STATS
--------------------------------------------------------------- */

function renderAdminStats() {
  const stats = getStats();
  const grid  = document.getElementById('stats-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <span class="stat-number">${stats.totalUsers}</span>
      <span class="stat-label">Total Users</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${stats.totalStudios}</span>
      <span class="stat-label">Studios Listed</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${stats.totalBookings}</span>
      <span class="stat-label">Total Bookings</span>
    </div>
    <div class="stat-card">
      <span class="stat-number" style="color:var(--clr-pending)">${stats.pendingCount}</span>
      <span class="stat-label">Pending</span>
    </div>
    <div class="stat-card">
      <span class="stat-number" style="color:var(--clr-approved)">${stats.approvedCount}</span>
      <span class="stat-label">Approved</span>
    </div>
    <div class="stat-card">
      <span class="stat-number" style="color:var(--clr-rejected)">${stats.rejectedCount}</span>
      <span class="stat-label">Rejected</span>
    </div>
  `;
}

/* ---------------------------------------------------------------
   USERS TABLE
--------------------------------------------------------------- */

function renderAdminUsers(query = '') {
  const tbody       = document.getElementById('users-body');
  if (!tbody) return;
  const currentUser = getCurrentUser();
  let users         = getUsers();

  if (query.trim()) {
    const q = query.toLowerCase();
    users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }

  tbody.innerHTML = '';

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:var(--sp-xl); color:var(--clr-text-muted);">No users found.</td></tr>`;
    return;
  }

  users.forEach(u => {
    const roleBadgeClass = { admin: 'badge-rejected', owner: 'badge-warning', user: 'badge-info' }[u.role] || 'badge-info';
    const isSelf = u.id === currentUser.id;
    const deleteBtn = isSelf
      ? `<span class="text-muted" style="font-size:0.8rem;">—</span>`
      : `<button class="btn btn-danger btn-sm" onclick="handleDeleteUser('${u.id}')">Delete</button>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${u.name}</strong>${isSelf ? ' <span class="badge badge-info" style="font-size:0.65rem;">You</span>' : ''}</td>
      <td>${u.email}</td>
      <td><span class="badge ${roleBadgeClass}">${u.role}</span></td>
      <td>${formatTimestamp(u.createdAt)}</td>
      <td>${deleteBtn}</td>
    `;
    tbody.appendChild(row);
  });
}

function handleDeleteUser(userId) {
  const user = getUserById(userId);
  if (!user) return;
  if (!confirm(`Delete user "${user.name}" (${user.email})?\n\nThis will also delete all their studios and bookings.`)) return;

  deleteUser(userId);
  toastSuccess('User Deleted', `"${user.name}" and their data have been removed.`);
  renderAdminStats();
  renderAdminUsers();
  renderAdminStudios();
  renderAdminBookings();
}

/* ---------------------------------------------------------------
   STUDIOS TABLE
--------------------------------------------------------------- */

function renderAdminStudios(query = '') {
  const tbody = document.getElementById('studios-body');
  if (!tbody) return;

  let studios = getStudios();
  if (query.trim()) {
    const q = query.toLowerCase();
    studios = studios.filter(s => s.name.toLowerCase().includes(q) || s.zone.toLowerCase().includes(q));
  }

  tbody.innerHTML = '';

  if (studios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:var(--sp-xl); color:var(--clr-text-muted);">No studios found.</td></tr>`;
    return;
  }

  studios.forEach(studio => {
    const owner      = getUserById(studio.ownerId);
    const ownerName  = owner ? owner.name : 'Unknown';
    const availBadge = studio.available
      ? `<span class="badge badge-approved">Available</span>`
      : `<span class="badge badge-rejected">Unavailable</span>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${studio.name}</strong></td>
      <td>${ownerName}</td>
      <td>${studio.zone.charAt(0).toUpperCase() + studio.zone.slice(1)}</td>
      <td>${formatCurrency(studio.price)}</td>
      <td>${availBadge}</td>
      <td><button class="btn btn-danger btn-sm" onclick="handleDeleteStudioAdmin('${studio.id}')">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

function handleDeleteStudioAdmin(studioId) {
  const studio = getStudioById(studioId);
  if (!studio) return;
  if (!confirm(`Delete studio "${studio.name}"?\nThis will also delete all associated bookings.`)) return;

  deleteStudio(studioId);
  toastSuccess('Studio Deleted', `"${studio.name}" has been removed.`);
  renderAdminStats();
  renderAdminStudios();
  renderAdminBookings();
}

/* ---------------------------------------------------------------
   BOOKINGS TABLE
--------------------------------------------------------------- */

function renderAdminBookings(query = '') {
  const tbody = document.getElementById('bookings-body');
  if (!tbody) return;

  let bookings = getBookings();
  if (query.trim()) {
    const q = query.toLowerCase();
    bookings = bookings.filter(b =>
      b.studioName.toLowerCase().includes(q) ||
      b.userName.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  }

  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  tbody.innerHTML = '';

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:var(--sp-xl); color:var(--clr-text-muted);">No bookings found.</td></tr>`;
    return;
  }

  bookings.forEach(booking => {
    const statusClass = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[booking.status] || 'badge-info';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${booking.studioName}</strong></td>
      <td>${booking.userName}</td>
      <td>${formatDate(booking.date)}</td>
      <td>${booking.hours} hr${booking.hours > 1 ? 's' : ''}</td>
      <td>${formatCurrency(booking.totalCost)}</td>
      <td><span class="badge ${statusClass}">${booking.status}</span></td>
      <td>${formatTimestamp(booking.createdAt)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="handleDeleteBookingAdmin('${booking.id}')">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

function handleDeleteBookingAdmin(bookingId) {
  if (!confirm('Delete this booking record permanently?')) return;
  deleteBooking(bookingId);
  toastSuccess('Booking Deleted', 'The booking record has been removed.');
  renderAdminStats();
  renderAdminBookings();
}
