/**
 * js/home-page.js — Public home page (index.html) logic
 * Loads studios from the real API, renders map, stats, reviews.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Dark mode
  const isDark = localStorage.getItem('lensspace_dark') === 'true';
  if (isDark) document.body.classList.add('dark');
  document.querySelectorAll('.dark-mode-toggle').forEach(btn =>
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('lensspace_dark', document.body.classList.contains('dark'));
    })
  );

  // Redirect logged-in users to their dashboard
  await redirectIfLoggedIn();

  // Load studios + populate zone filter
  await loadStudios();
  await populateZoneFilter();

  // Filter listeners
  const zoneFilter   = document.getElementById('filter-zone');
  const searchFilter = document.getElementById('filter-search');
  if (zoneFilter)   zoneFilter.addEventListener('change', loadStudios);
  if (searchFilter) {
    let debounce;
    searchFilter.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(loadStudios, 300);
    });
  }

  initCounters();
  initBackToTop();
  initStudioMapFromAPI();
});

let currentPage = 1;

async function loadStudios(page = 1) {
  currentPage = page;
  const grid = document.getElementById('studios-grid');
  if (!grid) return;

  const zone   = document.getElementById('filter-zone')?.value || 'all';
  const search = document.getElementById('filter-search')?.value?.trim() || '';

  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-lens">LS</div><p>Loading studios...</p></div>`;

  try {
    const params = { page, limit: 6 };
    if (zone && zone !== 'all') params.zone = zone;
    if (search) params.search = search;

    const data = await Studios.getAll(params);
    renderStudiosGrid(grid, data.studios, 'public');
    renderPagination(data, loadStudios);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-state-lens">LS</div>
      <h3>Could not load studios</h3>
      <p>${err.message}</p>
    </div>`;
  }
}

async function populateZoneFilter() {
  const sel = document.getElementById('filter-zone');
  if (!sel) return;
  const zones = [
    { value: 'maadi',     label: 'Maadi' },
    { value: 'zamalek',   label: 'Zamalek' },
    { value: 'nasr-city', label: 'Nasr City' },
    { value: 'new-cairo', label: 'New Cairo' },
  ];
  zones.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value; opt.textContent = label;
    sel.appendChild(opt);
  });
}

async function initStudioMapFromAPI() {
  try {
    const data = await Studios.getAll({ limit: 100 });
    renderLeafletMap('studio-map', data.studios);
  } catch { /* map is optional */ }
}

function handlePublicBookNow(studioId) {
  // Public visitors: redirect to login
  window.location.href = `login.html?redirect=user.html&studio=${studioId}`;
}

// ── Pagination renderer ──────────────────────────────────────────
function renderPagination({ page, pages }, loadFn) {
  let container = document.getElementById('pagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pagination';
    container.style.cssText = 'display:flex;justify-content:center;gap:8px;margin-top:24px;';
    document.getElementById('studios-grid')?.after(container);
  }
  container.innerHTML = '';
  if (pages <= 1) return;

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `btn btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}`;
    btn.addEventListener('click', () => loadFn(i));
    container.appendChild(btn);
  }
}

// ── Animated counters ────────────────────────────────────────────
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

function animateCounter(el, target, duration = 1500) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target) + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Back to top ──────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
