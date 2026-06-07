/**
 * js/auth-page.js — Login & Register page logic
 * Replaces localStorage auth with real API calls via api.js
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Redirect if already logged in
  await redirectIfLoggedIn();

  // ── Dark mode ────────────────────────────────────────────────
  const isDark = localStorage.getItem('lensspace_dark') === 'true';
  if (isDark) document.body.classList.add('dark');
  document.querySelectorAll('.dark-mode-toggle').forEach(btn =>
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('lensspace_dark', document.body.classList.contains('dark'));
    })
  );

  // ── Tab switching ─────────────────────────────────────────────
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === target));
      document.querySelectorAll('.auth-panel').forEach(p =>
        p.classList.toggle('active', p.id === `panel-${target}`)
      );
    });
  });

  // ── Password visibility toggle ────────────────────────────────
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.password-wrapper').querySelector('input');
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? 'Hide' : 'Show';
    });
  });

  // ── Password strength ─────────────────────────────────────────
  const regPw = document.getElementById('reg-password');
  if (regPw) regPw.addEventListener('input', () => updatePasswordStrength(regPw.value));

  // ── Login form ────────────────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('[type="submit"]');
      btn.disabled = true; btn.textContent = 'Signing in...';

      try {
        const data = await Auth.login({
          email:    document.getElementById('login-email').value.trim(),
          password: document.getElementById('login-password').value,
        });
        clearSessionCache();
        sessionStorage.setItem('lensspace_user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        }));
        toastSuccess('Welcome back!', `Signed in as ${data.user.name}`);
        const map = { user: 'user.html', owner: 'owner.html', admin: 'admin.html' };
        setTimeout(() => { window.location.href = map[data.user.role] || 'index.html'; }, 800);
      } catch (err) {
        toastError('Login Failed', err.message);
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    });
  }

  // ── Register form ─────────────────────────────────────────────
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('[type="submit"]');
      btn.disabled = true; btn.textContent = 'Creating account...';

      const password = document.getElementById('reg-password').value;
      const confirm  = document.getElementById('reg-confirm').value;
      if (password !== confirm) {
        toastError('Passwords do not match', 'Please re-enter your passwords.');
        btn.disabled = false; btn.textContent = 'Create Account';
        return;
      }

      const roleInput = registerForm.querySelector('input[name="role"]:checked');

      try {
        const data = await Auth.register({
          name:     document.getElementById('reg-name').value.trim(),
          email:    document.getElementById('reg-email').value.trim(),
          password,
          role:     roleInput?.value || 'user',
        });
        clearSessionCache();
        sessionStorage.setItem('lensspace_user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        }));
        toastSuccess('Account Created!', 'Redirecting to your dashboard...');
        const map = { user: 'user.html', owner: 'owner.html', admin: 'admin.html' };
        setTimeout(() => { window.location.href = map[data.user.role] || 'index.html'; }, 900);
      } catch (err) {
        toastError('Registration Failed', err.message);
        btn.disabled = false; btn.textContent = 'Create Account';
      }
    });
  }
});

// Password strength helper (reused from app.js pattern)
function updatePasswordStrength(password) {
  const fill  = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!fill || !label) return;
  if (!password) { fill.className = 'pw-strength-fill'; label.className = 'pw-strength-label'; label.textContent = ''; return; }
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  const level = score <= 1 ? 'weak' : score <= 2 ? 'fair' : 'strong';
  fill.className  = `pw-strength-fill ${level}`;
  label.className = `pw-strength-label ${level}`;
  label.textContent = { weak: 'Weak', fair: 'Fair', strong: 'Strong' }[level];
}
