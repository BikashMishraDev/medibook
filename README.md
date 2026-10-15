# MediBook — Full-Stack Appointment Booking Platform

A complete MERN-stack (MongoDB, Express, React, Node.js) appointment booking application.

## Project Structure

```
medibook/
├── backend/     Express + MongoDB REST API
└── frontend/    React + Vite + Tailwind CSS
```

## Features

- Browse, search, and filter doctors by specialty, price, and rating
- Doctor profile pages with availability
- Multi-step appointment booking (date → time → patient details → confirmation)
- Double-booking prevention (server-side check + unique DB index)
- JWT authentication (register/login/logout) with bcrypt password hashing
- Patient appointment management with cancellation
- Admin dashboard: stats, doctor CRUD, appointment status management
- Responsive, polished UI with loading skeletons, empty states, and modals

---

## 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 2. Set Up MongoDB

You need a running MongoDB instance. Two options:

**Option A — MongoDB Atlas (recommended, free tier):**
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Get your connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/medibook`)

**Option B — Local MongoDB:**
1. Install MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run `mongod` to start it locally (default: `mongodb://127.0.0.1:27017`)

## 3. Create .env Files

**backend/.env** (copy from `backend/.env.example`):
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret_string
```

**frontend/.env** (copy from `frontend/.env.example`):
```
VITE_API_URL=http://localhost:5000/api
```

## 4. Run the Backend

```bash
cd backend
npm run dev
```
Server starts on `http://localhost:5000`. You should see "MongoDB connected successfully".

## 5. Run the Frontend

In a new terminal:
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:5173`.

## 6. Seed Sample Doctors

With the backend's `.env` configured, run:
```bash
cd backend
npm run seed
```
This inserts 6 doctors (Cardiologist, Dermatologist, Dentist, Neurologist, Orthopedic, General Physician) with realistic availability.

---

## Creating an Admin User

There's no public "become admin" button (by design — patients can't self-promote to admin).
To create an admin:
1. Register a normal account through the UI.
2. Manually update that user's `role` field to `"admin"` in MongoDB (via Atlas UI, Compass, or the `mongosh` shell):
   ```js
   db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
   ```
3. Log out and back in — you'll now see the "Admin" link in the navbar and can access `/admin`.

## API Endpoints Reference

| Method | Endpoint | Auth |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Required |
| GET | /api/doctors | Public |
| GET | /api/doctors/:id | Public |
| POST | /api/doctors | Admin |
| PUT | /api/doctors/:id | Admin |
| DELETE | /api/doctors/:id | Admin |
| POST | /api/appointments | Required |
| GET | /api/appointments/my | Required |
| GET | /api/appointments/:id | Required |
| PUT | /api/appointments/:id/cancel | Required (owner or admin) |
| PUT | /api/appointments/:id/status | Required |
| GET | /api/admin/stats | Admin |
| GET | /api/admin/appointments | Admin |

## Notes on What Was Verified

This sandbox has no outbound access to MongoDB's servers (`fastdl.mongodb.org` isn't reachable), so I couldn't boot a real `mongod` to test against. Instead of leaving that unverified, I did the next most rigorous thing:

- **Automated integration tests** (`backend/__tests__/api.test.js`, run with `npm test` inside `backend/`): 21 tests that drive the *real* Express app, routes, controllers, and auth/admin middleware through `supertest`, with only the database layer swapped for in-memory fakes (see `backend/models/__mocks__/`). These cover registration, login, password-never-leaked checks, admin-only route protection, doctor CRUD, search/filter queries, booking, **double-booking prevention**, past-date rejection, cancellation (including the "can't cancel someone else's appointment" and "can't cancel twice" cases), and the full admin dashboard. All 21 pass.
- **Live server boot test**: ran the real `server.js` against an unreachable MongoDB URI to confirm it fails with a clear error instead of hanging or crashing silently. It originally took mongoose's default 30s to fail — I tightened that to 8s (`serverSelectionTimeoutMS` in `config/db.js`) so a bad connection string gives fast feedback.
- **Live frontend boot test**: actually started the Vite dev server and fetched every single page, component, context, and service file over HTTP — all compiled and transformed with no errors.
- A full production build (`vite build`) completes cleanly with no warnings.

What's *not* verified: actual persistence against real MongoDB, and the UI rendered in a real browser. The query logic, schema shape, and index definitions are standard Mongoose and should work as written, but please run through register → book → cancel → admin actions yourself once you've got a real `MONGODB_URI` plugged in, and tell me if anything breaks.
