/* =============================================================
   js/storage.js — Client-Side "Database" using localStorage
   Photoshoot Studio Reservation System
   ============================================================= */

'use strict';

const KEYS = {
  USERS:        'photostudio_users',
  STUDIOS:      'photostudio_studios',
  BOOKINGS:     'photostudio_bookings',
  CURRENT_USER: 'photostudio_current_user',
};

const SEED_USERS = [
  { id: 'u1', name: 'Alice Admin', email: 'admin@studio.com', password: 'Admin123!', role: 'admin', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'u2', name: 'Omar Owner', email: 'owner@studio.com', password: 'Owner123!', role: 'owner', createdAt: '2024-01-02T00:00:00.000Z' },
  { id: 'u3', name: 'Sara User',  email: 'user@studio.com',  password: 'User1234!', role: 'user',  createdAt: '2024-01-03T00:00:00.000Z' },
];

const SEED_STUDIOS = [
  { id: 's1', ownerId: 'u2', name: 'Golden Light Studio',    zone: 'downtown',  description: 'A bright, airy space with floor-to-ceiling windows. Perfect for portrait and fashion shoots.', price: 120, capacity: 8,  available: true, features: ['Natural Light', 'Backdrop Wall', 'Dressing Room'], createdAt: '2024-01-05T00:00:00.000Z' },
  { id: 's2', ownerId: 'u2', name: 'Dark Elegance Studio',   zone: 'westside',  description: 'A moody studio with professional LED lighting rigs. Great for dramatic portraits.',             price: 150, capacity: 6,  available: true, features: ['LED Rigs', 'Fog Machine', 'Music System'],      createdAt: '2024-01-06T00:00:00.000Z' },
  { id: 's3', ownerId: 'u2', name: 'Rooftop Skyline Studio', zone: 'northside', description: 'An outdoor rooftop studio with a stunning city skyline backdrop.',                               price: 200, capacity: 10, available: true, features: ['Outdoor', 'Skyline View', 'Sunset Hours'],     createdAt: '2024-01-07T00:00:00.000Z' },
];

const SEED_BOOKINGS = [];

function initStorage() {
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS,    JSON.stringify(SEED_USERS));
    localStorage.setItem(KEYS.STUDIOS,  JSON.stringify(SEED_STUDIOS));
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
  }
}

function getAll(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function saveAll(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}

function generateId() {
  return `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/* Users */
function getUsers()           { return getAll(KEYS.USERS); }
function getUserByEmail(email){ return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null; }
function getUserById(id)      { return getUsers().find(u => u.id === id) || null; }

function createUser(userData) {
  const users = getUsers();
  const newUser = { id: generateId(), name: userData.name.trim(), email: userData.email.trim().toLowerCase(), password: userData.password, role: userData.role || 'user', createdAt: new Date().toISOString() };
  users.push(newUser);
  saveAll(KEYS.USERS, users);
  return newUser;
}

function deleteUser(userId) {
  saveAll(KEYS.USERS,    getUsers().filter(u => u.id !== userId));
  saveAll(KEYS.BOOKINGS, getBookings().filter(b => b.userId !== userId));
  saveAll(KEYS.STUDIOS,  getStudios().filter(s => s.ownerId !== userId));
}

/* Auth */
function loginUser(email, password) {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    const sessionUser = { ...user };
    delete sessionUser.password;
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    return sessionUser;
  }
  return null;
}

function getCurrentUser() {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
}

function logoutUser() { localStorage.removeItem(KEYS.CURRENT_USER); }

/* Studios */
function getStudios()             { return getAll(KEYS.STUDIOS); }
function getStudiosByOwner(id)    { return getStudios().filter(s => s.ownerId === id); }
function getStudioById(id)        { return getStudios().find(s => s.id === id) || null; }

function createStudio(data) {
  const studios = getStudios();
  const s = { id: generateId(), ownerId: data.ownerId, name: data.name.trim(), zone: data.zone, description: data.description.trim(), price: parseFloat(data.price), capacity: parseInt(data.capacity, 10), available: true, features: data.features || [], createdAt: new Date().toISOString() };
  studios.push(s);
  saveAll(KEYS.STUDIOS, studios);
  return s;
}

function updateStudio(studioId, updates) {
  const studios = getStudios();
  const i = studios.findIndex(s => s.id === studioId);
  if (i === -1) return null;
  studios[i] = { ...studios[i], ...updates };
  saveAll(KEYS.STUDIOS, studios);
  return studios[i];
}

function deleteStudio(studioId) {
  saveAll(KEYS.STUDIOS,  getStudios().filter(s => s.id !== studioId));
  saveAll(KEYS.BOOKINGS, getBookings().filter(b => b.studioId !== studioId));
}

/* Bookings */
function getBookings()            { return getAll(KEYS.BOOKINGS); }
function getBookingsByUser(uid)   { return getBookings().filter(b => b.userId === uid); }
function getBookingsByOwner(ownerId) {
  const ids = getStudiosByOwner(ownerId).map(s => s.id);
  return getBookings().filter(b => ids.includes(b.studioId));
}

function createBooking(data) {
  const bookings = getBookings();
  const studio   = getStudioById(data.studioId);
  const b = { id: generateId(), studioId: data.studioId, studioName: studio ? studio.name : 'Unknown', userId: data.userId, userName: data.userName || 'Unknown', date: data.date, startTime: data.startTime, hours: parseInt(data.hours, 10), totalCost: studio ? studio.price * parseInt(data.hours, 10) : 0, status: 'pending', notes: data.notes || '', createdAt: new Date().toISOString() };
  bookings.push(b);
  saveAll(KEYS.BOOKINGS, bookings);
  return b;
}

function updateBookingStatus(bookingId, status) {
  const bookings = getBookings();
  const i = bookings.findIndex(b => b.id === bookingId);
  if (i === -1) return null;
  bookings[i].status    = status;
  bookings[i].updatedAt = new Date().toISOString();
  saveAll(KEYS.BOOKINGS, bookings);
  return bookings[i];
}

function deleteBooking(bookingId) {
  saveAll(KEYS.BOOKINGS, getBookings().filter(b => b.id !== bookingId));
}

/* Stats */
function getStats() {
  const bookings = getBookings();
  return { totalUsers: getUsers().length, totalStudios: getStudios().length, totalBookings: bookings.length, pendingCount: bookings.filter(b => b.status === 'pending').length, approvedCount: bookings.filter(b => b.status === 'approved').length, rejectedCount: bookings.filter(b => b.status === 'rejected').length };
}

/* Formatters */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatTimestamp(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatCurrency(amount) {
  return `EGP ${Number(amount).toLocaleString('en-EG')}`;
}
