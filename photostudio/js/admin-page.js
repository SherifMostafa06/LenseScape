/**
 * js/admin-page.js — Admin dashboard logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  initSidebar();

  const user = await requireAuth('admin');
  if (!user) return;

  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = 'Administrator';

  await setupLogout();
  await loadAdminStats();
  await loadAdminUsers();
  await loadAdminStudios();
  await loadAdminBookings();

  // Tab nav
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      document.querySelectorAll('.dashboard-section').forEach(s => s.classList.toggle('active', s.id === target));
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (window.innerWidth < 769) document.querySelector('.sidebar')?.classList.remove('open');
    });
  });
});

// ── Stats ────────────────────────────────────────────────────────
async function loadAdminStats() {
  try {
    const { stats } = await Admin.getStats();
    const map = {
      'stat-total-users':    stats.totalUsers,
      'stat-total-studios':  stats.totalStudios,
      'stat-total-bookings': stats.totalBookings,
      'stat-pending':        stats.pendingBookings,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  } catch {}
}

// ── Users ────────────────────────────────────────────────────────
let usersPage = 1;
async function loadAdminUsers(page = 1) {
  usersPage = page;
  const container = document.getElementById('admin-users-list');
  if (!container) return;
  container.innerHTML = '<p>Loading...</p>';

  try {
    const { users, total, pages } = await Admin.getUsers(page);
    const roleClass = { user: 'badge-info', owner: 'badge-warning', admin: 'badge-success' };
    container.innerHTML = `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge ${roleClass[u.role] || 'badge-info'}">${u.role}</span></td>
                <td>${new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteAdminUser('${u._id}')">Delete</button>` : '<span style="color:var(--clr-text-muted)">—</span>'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:0.82rem;color:var(--clr-text-muted);margin-top:8px;">Total: ${total} users</p>`;
    renderAdminPagination(container, { page, pages }, loadAdminUsers);
  } catch (err) {
    container.innerHTML = `<p style="color:var(--clr-error);">${err.message}</p>`;
  }
}

async function deleteAdminUser(id) {
  if (!confirm('Delete this user? This cannot be undone.')) return;
  try {
    await Admin.deleteUser(id);
    toastSuccess('Deleted', 'User removed.');
    await loadAdminUsers(usersPage);
  } catch (err) {
    toastError('Error', err.message);
  }
}

// ── Studios ──────────────────────────────────────────────────────
let studiosPage = 1;
async function loadAdminStudios(page = 1) {
  studiosPage = page;
  const container = document.getElementById('admin-studios-list');
  if (!container) return;
  container.innerHTML = '<p>Loading...</p>';

  try {
    const { studios, total, pages } = await Admin.getStudios(page);
    const ZONE_LABELS = { 'maadi': 'Maadi', 'zamalek': 'Zamalek', 'nasr-city': 'Nasr City', 'new-cairo': 'New Cairo' };
    container.innerHTML = `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Owner</th><th>Zone</th><th>Price/hr</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${studios.map(s => `
              <tr>
                <td>${s.name}</td>
                <td>${s.ownerId?.name || '—'}</td>
                <td>${ZONE_LABELS[s.zone] || s.zone}</td>
                <td>EGP ${s.price}</td>
                <td>
                  <span class="badge ${s.available ? 'badge-success' : 'badge-error'}">
                    ${s.available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="toggleAdminStudio('${s._id}')">
                    ${s.available ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:0.82rem;color:var(--clr-text-muted);margin-top:8px;">Total: ${total} studios</p>`;
    renderAdminPagination(container, { page, pages }, loadAdminStudios);
  } catch (err) {
    container.innerHTML = `<p style="color:var(--clr-error);">${err.message}</p>`;
  }
}

async function toggleAdminStudio(id) {
  try {
    const { studio } = await Admin.toggleStudio(id);
    toastInfo('Updated', `Studio is now ${studio.available ? 'available' : 'unavailable'}.`);
    await loadAdminStudios(studiosPage);
  } catch (err) {
    toastError('Error', err.message);
  }
}

// ── Bookings ─────────────────────────────────────────────────────
let bookingsPage = 1;
async function loadAdminBookings(page = 1) {
  bookingsPage = page;
  const container = document.getElementById('admin-bookings-list');
  if (!container) return;
  container.innerHTML = '<p>Loading...</p>';

  try {
    const { bookings, total, pages } = await Admin.getBookings(page);
    const statusClass = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' };
    container.innerHTML = `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>User</th><th>Studio</th><th>Date</th><th>Hours</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td>${b.userId?.name || '—'}</td>
                <td>${b.studioId?.name || '—'}</td>
                <td>${new Date(b.date).toLocaleDateString('en-GB')}</td>
                <td>${b.hours}</td>
                <td>EGP ${b.totalPrice}</td>
                <td><span class="badge ${statusClass[b.status] || 'badge-info'}">${b.status}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:0.82rem;color:var(--clr-text-muted);margin-top:8px;">Total: ${total} bookings</p>`;
    renderAdminPagination(container, { page, pages }, loadAdminBookings);
  } catch (err) {
    container.innerHTML = `<p style="color:var(--clr-error);">${err.message}</p>`;
  }
}

// ── Pagination helper ────────────────────────────────────────────
function renderAdminPagination(container, { page, pages }, loadFn) {
  if (pages <= 1) return;
  const pag = document.createElement('div');
  pag.style.cssText = 'display:flex;gap:6px;margin-top:12px;';
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `btn btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}`;
    btn.addEventListener('click', () => loadFn(i));
    pag.appendChild(btn);
  }
  container.appendChild(pag);
}
