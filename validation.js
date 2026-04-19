/* =============================================================
   js/validation.js — Form Validation Logic
   Photoshoot Studio Reservation System
   ============================================================= */

'use strict';

const REGEX = {
  EMAIL:    /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  NAME:     /^[a-zA-Z\u0600-\u06FF\s'\-]{2,60}$/,
  TIME:     /^([01]\d|2[0-3]):([0-5]\d)$/,
};

function validateRequired(value, fieldName = 'This field') {
  const trimmed = String(value || '').trim();
  if (trimmed.length === 0) return { valid: false, message: `${fieldName} is required.` };
  return { valid: true, message: '' };
}

function validateEmail(email) {
  const req = validateRequired(email, 'Email');
  if (!req.valid) return req;
  if (!REGEX.EMAIL.test(email.trim())) return { valid: false, message: 'Please enter a valid email address (e.g. name@example.com).' };
  return { valid: true, message: '' };
}

function validatePassword(password) {
  const req = validateRequired(password, 'Password');
  if (!req.valid) return req;
  if (!REGEX.PASSWORD.test(password)) return { valid: false, message: 'Password must be at least 8 characters with uppercase, lowercase, and a number.' };
  return { valid: true, message: '' };
}

function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) return { valid: false, message: 'Passwords do not match.' };
  return { valid: true, message: '' };
}

function validateName(name) {
  const req = validateRequired(name, 'Name');
  if (!req.valid) return req;
  if (!REGEX.NAME.test(name.trim())) return { valid: false, message: 'Name must be 2–60 characters (letters only).' };
  return { valid: true, message: '' };
}

function validatePositiveNumber(value, fieldName = 'Price', min = 0) {
  const req = validateRequired(value, fieldName);
  if (!req.valid) return req;
  const num = parseFloat(value);
  if (isNaN(num)) return { valid: false, message: `${fieldName} must be a valid number.` };
  if (num <= min) return { valid: false, message: `${fieldName} must be greater than ${min}.` };
  return { valid: true, message: '' };
}

function validateFutureDate(dateStr) {
  const req = validateRequired(dateStr, 'Date');
  if (!req.valid) return req;
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const selected = new Date(dateStr + 'T00:00:00');
  if (selected < today) return { valid: false, message: 'Booking date cannot be in the past.' };
  return { valid: true, message: '' };
}

function validateTime(timeStr) {
  const req = validateRequired(timeStr, 'Time');
  if (!req.valid) return req;
  if (!REGEX.TIME.test(timeStr)) return { valid: false, message: 'Please enter a valid time in HH:MM format.' };
  return { valid: true, message: '' };
}

function validateRange(value, fieldName, min, max) {
  const num = parseInt(value, 10);
  if (isNaN(num)) return { valid: false, message: `${fieldName} must be a number.` };
  if (num < min || num > max) return { valid: false, message: `${fieldName} must be between ${min} and ${max}.` };
  return { valid: true, message: '' };
}

/* Form-level validators */
function validateLoginForm(data) {
  const errors = {};
  const er = validateEmail(data.email);
  if (!er.valid) errors.email = er.message;
  const pr = validateRequired(data.password, 'Password');
  if (!pr.valid) errors.password = pr.message;
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateRegisterForm(data) {
  const errors = {};
  const nr = validateName(data.name);          if (!nr.valid) errors.name = nr.message;
  const er = validateEmail(data.email);        if (!er.valid) errors.email = er.message;
  const pr = validatePassword(data.password);  if (!pr.valid) errors.password = pr.message;
  if (data.password) { const mr = validatePasswordMatch(data.password, data.confirmPassword); if (!mr.valid) errors.confirmPassword = mr.message; }
  const rr = validateRequired(data.role, 'Role'); if (!rr.valid) errors.role = rr.message;
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateBookingForm(data) {
  const errors = {};
  const sr = validateRequired(data.studioId, 'Studio'); if (!sr.valid) errors.studioId = sr.message;
  const dr = validateFutureDate(data.date);             if (!dr.valid) errors.date = dr.message;
  const tr = validateTime(data.startTime);              if (!tr.valid) errors.startTime = tr.message;
  const hr = validateRange(data.hours, 'Hours', 1, 12); if (!hr.valid) errors.hours = hr.message;
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateStudioForm(data) {
  const errors = {};
  const nr = validateRequired(data.name,        'Studio name'); if (!nr.valid) errors.name = nr.message;
  const zr = validateRequired(data.zone,        'Zone');        if (!zr.valid) errors.zone = zr.message;
  const dr = validateRequired(data.description, 'Description'); if (!dr.valid) errors.description = dr.message;
  const pr = validatePositiveNumber(data.price, 'Hourly price', 0); if (!pr.valid) errors.price = pr.message;
  const cr = validateRange(data.capacity, 'Capacity', 1, 100); if (!cr.valid) errors.capacity = cr.message;
  return { valid: Object.keys(errors).length === 0, errors };
}

/* DOM helpers */
function showFieldError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add('error');
  inputEl.classList.remove('valid');
  const errorEl = inputEl.parentElement.querySelector('.field-error');
  if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
}

function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('error');
  inputEl.classList.add('valid');
  const errorEl = inputEl.parentElement.querySelector('.field-error');
  if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
}

function clearAllErrors(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => el.classList.remove('error', 'valid'));
  formEl.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
}

function applyFormErrors(formEl, errors) {
  clearAllErrors(formEl);
  Object.entries(errors).forEach(([field, message]) => {
    const inputEl = formEl.querySelector(`[name="${field}"], #${field}`);
    if (inputEl) showFieldError(inputEl, message);
  });
}
