# LensSpace ΓÇö Setup Guide

## Prerequisites
- Node.js 18+
- A free MongoDB Atlas account (https://cloud.mongodb.com)

## Setup Steps

### 1. MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user (Database Access ΓåÆ Add New User)
3. Whitelist your IP (Network Access ΓåÆ Add IP ΓåÆ Allow from anywhere: `0.0.0.0/0`)
4. Get your connection string (Connect ΓåÆ Connect your application ΓåÆ Copy the URI)

### 2. Configure Environment Variables
Edit the `.env` file in the root folder:
```
MONGO_URI=mongodb+srv://yourUser:yourPassword@cluster0.xxxxx.mongodb.net/lensspace?retryWrites=true&w=majority
SESSION_SECRET=any_long_random_string_here
PORT=3000
EMAIL_USER=yourgmail@gmail.com     ΓåÉ optional, for booking emails
EMAIL_PASS=your_app_password       ΓåÉ Gmail App Password (not your real password)
```

> **Gmail App Password**: Google Account ΓåÆ Security ΓåÆ 2-Step Verification ΓåÆ App passwords

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
2. In MongoDB Atlas ΓåÆ Browse Collections ΓåÆ `users` collection
3. Find your user and change `role` from `"user"` to `"admin"`
4. Log out and log back in

---

## Project Structure
```
photoshoot v3/
Γö£ΓöÇΓöÇ photostudio/          ΓåÉ Frontend (HTML, CSS, JS)
Γöé   Γö£ΓöÇΓöÇ index.html        ΓåÉ Public home page
Γöé   Γö£ΓöÇΓöÇ login.html        ΓåÉ Sign in / Register
Γöé   Γö£ΓöÇΓöÇ user.html         ΓåÉ User dashboard
Γöé   Γö£ΓöÇΓöÇ owner.html        ΓåÉ Studio owner dashboard
Γöé   Γö£ΓöÇΓöÇ admin.html        ΓåÉ Admin panel
Γöé   Γö£ΓöÇΓöÇ about.html        ΓåÉ About page
Γöé   Γö£ΓöÇΓöÇ css/              ΓåÉ Stylesheets
Γöé   ΓööΓöÇΓöÇ js/               ΓåÉ Client-side scripts
Γöé       Γö£ΓöÇΓöÇ api.js         ΓåÉ API client (fetch wrapper)
Γöé       Γö£ΓöÇΓöÇ ui-helpers.js  ΓåÉ Shared UI functions
Γöé       Γö£ΓöÇΓöÇ i18n.js        ΓåÉ Arabic/English localization
Γöé       Γö£ΓöÇΓöÇ auth-page.js   ΓåÉ Login/register page
Γöé       Γö£ΓöÇΓöÇ home-page.js   ΓåÉ Home page
Γöé       Γö£ΓöÇΓöÇ user-page.js   ΓåÉ User dashboard
Γöé       Γö£ΓöÇΓöÇ owner-page.js  ΓåÉ Owner dashboard
Γöé       ΓööΓöÇΓöÇ admin-page.js  ΓåÉ Admin dashboard
Γö£ΓöÇΓöÇ backend/              ΓåÉ Backend (Node.js/Express)
Γöé   Γö£ΓöÇΓöÇ config/           ΓåÉ DB & email config
Γöé   Γö£ΓöÇΓöÇ models/           ΓåÉ Mongoose models (User, Studio, Booking)
Γöé   Γö£ΓöÇΓöÇ controllers/      ΓåÉ Route handlers
Γöé   Γö£ΓöÇΓöÇ routes/           ΓåÉ Express routers
Γöé   Γö£ΓöÇΓöÇ middleware/        ΓåÉ Auth, error handler, upload, asyncWrapper
Γöé   ΓööΓöÇΓöÇ utils/            ΓåÉ AppError, sendEmail
Γö£ΓöÇΓöÇ uploads/              ΓåÉ Studio image uploads (auto-created)
Γö£ΓöÇΓöÇ server.js             ΓåÉ Entry point
Γö£ΓöÇΓöÇ .env                  ΓåÉ Environment variables (DO NOT commit)
ΓööΓöÇΓöÇ package.json
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
