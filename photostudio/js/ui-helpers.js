/**
 * js/ui-helpers.js — Shared rendering helpers used across multiple pages
 * - renderStudiosGrid()
 * - renderLeafletMap()
 * - toastSuccess / toastError / toastInfo
 */

// ── Toast Notifications ──────────────────────────────────────────
function _getToastContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

function _showToast(type, title, message = '') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = _getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close">✕</button>`;
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function toastSuccess(title, message) { _showToast('success', title, message); }
function toastError(title, message)   { _showToast('error',   title, message); }
function toastInfo(title, message)    { _showToast('info',    title, message); }
function toastWarning(title, message) { _showToast('warning', title, message); }


const ZONE_LABELS = { 'maadi': 'Maadi', 'zamalek': 'Zamalek', 'nasr-city': 'Nasr City', 'new-cairo': 'New Cairo' };
const ZONE_COLORS = { 'maadi': '#2d7a4f', 'zamalek': '#6b35a8', 'nasr-city': '#1a5fa0', 'new-cairo': '#c8833a' };

// ── Studio Cards ─────────────────────────────────────────────────
/**
 * Renders studio cards into a grid element.
 * @param {HTMLElement} grid
 * @param {object[]} studios
 * @param {'public'|'user'|'owner'|'admin'} context - determines which action button to show
 */
function renderStudiosGrid(grid, studios, context = 'public') {
  grid.innerHTML = '';
  if (!studios || studios.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-lens">LS</div>
        <h3>No Studios Found</h3>
        <p>Try a different zone or search term.</p>
      </div>`;
    return;
  }

  studios.forEach(studio => {
    const card = document.createElement('div');
    card.className = 'card studio-card';
    card.dataset.studioId = studio._id;

    const zoneLabel = ZONE_LABELS[studio.zone] || studio.zone;
    const zoneClass = `zone-${studio.zone}`;
    const imgSrc    = studio.images?.[0] || null;
    const features  = (studio.features || []).slice(0, 3).map(f => `<span class="badge badge-info">${f}</span>`).join('');

    // Action button varies by context
    let actionBtn = '';
    if (context === 'public') {
      actionBtn = `<button class="btn btn-primary btn-sm" onclick="handlePublicBookNow('${studio._id}')">Book Now</button>`;
    } else if (context === 'user') {
      actionBtn = `<button class="btn btn-primary btn-sm" onclick="openBookingModal('${studio._id}')">Book Now</button>`;
    } else if (context === 'owner') {
      actionBtn = `
        <button class="btn btn-secondary btn-sm" onclick="openEditStudioModal('${studio._id}')">Edit</button>
        <button class="btn btn-danger btn-sm"    onclick="deleteStudio('${studio._id}')">Delete</button>`;
    }

    card.innerHTML = `
      <div class="studio-card-image ${zoneClass}" style="${imgSrc ? `background-image:url('${imgSrc}');background-size:cover;background-position:center;` : ''}">
        ${!imgSrc ? 'Studio' : ''}
      </div>
      <div class="studio-card-body">
        <h3 class="studio-card-name">${studio.name}</h3>
        <div class="studio-card-meta">
          <span>Zone: ${zoneLabel}</span>
          <span>Capacity: ${studio.capacity}</span>
        </div>
        <p style="font-size:0.85rem;margin-bottom:var(--sp-sm);">${studio.description}</p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:var(--sp-md);">${features}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span class="studio-price">
            EGP ${studio.price}
            <span style="font-size:0.7rem;font-weight:400;color:var(--clr-text-muted);">/hr</span>
          </span>
          <div style="display:flex;gap:6px;">${actionBtn}</div>
        </div>
      </div>`;

    grid.appendChild(card);
  });
}

// ── Leaflet Map ──────────────────────────────────────────────────
function renderLeafletMap(containerId, studios) {
  const mapEl = document.getElementById(containerId);
  if (!mapEl || typeof L === 'undefined') return;

  // Destroy existing map instance if any
  if (mapEl._leaflet_id) {
    mapEl._leaflet_id = null;
    mapEl.innerHTML = '';
  }

  const map = L.map(containerId).setView([30.0444, 31.2357], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  const markers = {};
  const validStudios = (studios || []).filter(s => s.lat && s.lng);

  validStudios.forEach(studio => {
    const color = ZONE_COLORS[studio.zone] || '#c8833a';
    const icon  = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px;font-family:Georgia,serif;">LS</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
    });

    const marker = L.marker([studio.lat, studio.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="min-width:180px;">
          <strong style="font-size:0.95rem;">${studio.name}</strong><br/>
          <span style="font-size:0.78rem;color:#6b6560;">${ZONE_LABELS[studio.zone] || studio.zone}</span><br/>
          <span style="font-size:0.82rem;font-weight:600;color:${color};">EGP ${studio.price}/hr</span><br/>
          <span style="font-size:0.75rem;color:#6b6560;">Capacity: ${studio.capacity}</span>
        </div>`);
    markers[studio._id] = marker;
  });

  // Geolocation: find nearest studio
  const statusText = document.getElementById('map-location-status-text');
  const dot        = document.getElementById('map-location-dot');

  if (statusText) statusText.textContent = 'Detecting your location...';

  if (navigator.geolocation) {
    const geoOptions = { timeout: 10000, maximumAge: 60000 };

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: uLat, longitude: uLng } = pos.coords;

      // User dot
      L.marker([uLat, uLng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#2d7a4f;border:3px solid #fff;box-shadow:0 0 0 4px rgba(45,122,79,0.3);"></div>`,
          iconSize: [14,14], iconAnchor: [7,7],
        })
      }).addTo(map).bindPopup('<strong>You are here</strong>');

      map.setView([uLat, uLng], 12);

      if (validStudios.length) {
        function haversine(lat1, lng1, lat2, lng2) {
          const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
          const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        }

        let nearest = null, minDist = Infinity;
        validStudios.forEach(s => {
          const d = haversine(uLat, uLng, s.lat, s.lng);
          if (d < minDist) { minDist = d; nearest = s; }
        });

        if (nearest && markers[nearest._id]) {
          markers[nearest._id].openPopup();
          if (dot) dot.classList.add('active');
          if (statusText) statusText.textContent = `Nearest: ${nearest.name} (~${minDist.toFixed(1)} km)`;

          document.querySelectorAll('.nearest-badge').forEach(b => b.remove());
          const card = document.querySelector(`[data-studio-id="${nearest._id}"]`);
          if (card) {
            const imgEl = card.querySelector('.studio-card-image');
            if (imgEl) {
              const badge = document.createElement('span');
              badge.className = 'nearest-badge';
              badge.textContent = 'Nearest to You';
              imgEl.appendChild(badge);
            }
          }
        }
      } else {
        if (statusText) statusText.textContent = 'Location found — no studios with map coordinates yet';
      }
    }, () => {
      // Geolocation denied or failed
      if (statusText) statusText.textContent = 'Location not available — showing Cairo';
    }, geoOptions);
  } else {
    if (statusText) statusText.textContent = 'Location not supported by your browser';
  }

  return map;
}

// ── Sidebar helpers ──────────────────────────────────────────────
function initSidebar() {
  const toggle   = document.getElementById('menu-toggle');
  const sidebar  = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;

  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function open()  { sidebar.classList.add('open'); backdrop.classList.add('visible'); document.body.style.overflow = 'hidden'; }
  function close() { sidebar.classList.remove('open'); backdrop.classList.remove('visible'); document.body.style.overflow = ''; }

  toggle.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
  backdrop.addEventListener('click', close);
}

// ── Shared logout ────────────────────────────────────────────────
async function setupLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      await Auth.logout();
      clearSessionCache();
      window.location.href = '/index.html';
    } catch {
      window.location.href = '/index.html';
    }
  });
}

// ── Modal overlays (shared) ─────────────────────────────────────
function openModalOverlay(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return false;
  modal.classList.add('active');
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  return true;
}

function closeModalOverlay(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = '';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initModalOverlay(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => closeModalOverlay(modalId));
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalOverlay(modalId);
  });
}

// ── Dark mode for dashboard pages ────────────────────────────────
function initDarkMode() {
  const isDark = localStorage.getItem('lensspace_dark') === 'true';
  if (isDark) document.body.classList.add('dark');
  document.querySelectorAll('.dark-mode-toggle').forEach(btn =>
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('lensspace_dark', document.body.classList.contains('dark'));
    })
  );
}
