# LensSpace — Setup Guide

## Prerequisites
- Node.js 18+
- A free MongoDB Atlas account (https://cloud.mongodb.com)

## Setup Steps

### 1. MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user (Database Access → Add New User)
3. Whitelist your IP (Network Access → Add IP → Allow from anywhere: `0.0.0.0/0`)
4. Get your connection string (Connect → Connect your application → Copy the URI)

### 2. Configure Environment Variables
Edit the `.env` file in the root folder:
```
MONGO_URI=mongodb+srv://yourUser:yourPassword@cluster0.xxxxx.mongodb.net/lensspace?retryWrites=true&w=majority
SESSION_SECRET=any_long_random_string_here
PORT=3000
EMAIL_USER=yourgmail@gmail.com     ← optional, for booking emails
EMAIL_PASS=your_app_password       ← Gmail App Password (not your real password)
```

> **Gmail App Password**: Google Account → Security → 2-Step Verification → App passwords

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Server
```bash
npm start
# or for live reload during development:
npx nodemon server.js
```

### 5. Open the App
Visit: **http://localhost:3000**

---

## Default Admin Account
There is no seeded admin account. To create one:
1. Register normally at http://localhost:3000/login.html
2. In MongoDB Atlas → Browse Collections → `users` collection
3. Find your user and change `role` from `"user"` to `"admin"`
4. Log out and log back in

---

## Project Structure
```
photoshoot v3/
├── photostudio/          ← Frontend (HTML, CSS, JS)
│   ├── index.html        ← Public home page
│   ├── login.html        ← Sign in / Register
│   ├── user.html         ← User dashboard
│   ├── owner.html        ← Studio owner dashboard
│   ├── admin.html        ← Admin panel
│   ├── about.html        ← About page
│   ├── css/              ← Stylesheets
│   └── js/               ← Client-side scripts
│       ├── api.js         ← API client (fetch wrapper)
│       ├── ui-helpers.js  ← Shared UI functions
│       ├── i18n.js        ← Arabic/English localization
│       ├── auth-page.js   ← Login/register page
│       ├── home-page.js   ← Home page
│       ├── user-page.js   ← User dashboard
│       ├── owner-page.js  ← Owner dashboard
│       └── admin-page.js  ← Admin dashboard
├── backend/              ← Backend (Node.js/Express)
│   ├── config/           ← DB & email config
│   ├── models/           ← Mongoose models (User, Studio, Booking)
│   ├── controllers/      ← Route handlers
│   ├── routes/           ← Express routers
│   ├── middleware/        ← Auth, error handler, upload, asyncWrapper
│   └── utils/            ← AppError, sendEmail
├── uploads/              ← Studio image uploads (auto-created)
├── server.js             ← Entry point
├── .env                  ← Environment variables (DO NOT commit)
└── package.json
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET  | /api/auth/me | Get current user |
| GET  | /api/studios | List studios (paginated, filterable) |
| POST | /api/studios | Create studio (owner) |
| PUT  | /api/studios/:id | Update studio (owner) |
| DELETE | /api/studios/:id | Delete studio (owner/admin) |
| POST | /api/bookings | Create booking (user) |
| GET  | /api/bookings/my | My bookings (user) |
| GET  | /api/bookings/owner | All bookings for owner's studios |
| PATCH | /api/bookings/:id/status | Approve/reject booking (owner) |
| GET  | /api/admin/stats | Dashboard stats (admin) |
| GET  | /api/admin/users | All users (admin) |
| DELETE | /api/admin/users/:id | Delete user (admin) |
| GET  | /api/admin/studios | All studios (admin) |
| GET  | /api/admin/bookings | All bookings (admin) |
