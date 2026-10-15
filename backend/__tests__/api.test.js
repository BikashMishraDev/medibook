// Integration tests that drive the REAL Express app (app.js), real routes,
// real controllers, and real auth/admin middleware through supertest.
// Only the persistence layer (Mongoose models) is swapped for in-memory fakes
// via the manual mocks in models/__mocks__/, since no live MongoDB is reachable
// in this sandbox. Business logic, status codes, and auth/role enforcement are
// all exercised exactly as they run in production.

process.env.JWT_SECRET = 'test_secret_for_ci_only';

jest.mock('../models/User');
jest.mock('../models/Doctor');
jest.mock('../models/Appointment');

const request = require('supertest');
const app = require('../app');
const { reset } = require('../models/__mocks__/__store');

beforeEach(() => reset());

const registerAndLogin = async (overrides = {}) => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test Patient',
    email: 'patient@example.com',
    password: 'password123',
    phone: '9999999999',
    ...overrides
  });
  return res.body;
};

const registerAdmin = async () => {
  // role is force-set to 'patient' by the controller; we promote manually here,
  // the same way the README instructs a real deployer to do it via the DB.
  const { collections } = require('../models/__mocks__/__store');
  const { user, token } = await registerAndLogin({ email: 'admin@example.com' });
  const stored = collections.users.get(user.id);
  stored.role = 'admin';
  collections.users.set(user.id, stored);
  // token already encodes just the id, so it stays valid after the role flip
  return { token, user: { ...user, role: 'admin' } };
};

const createDoctorDirect = async (adminToken, overrides = {}) => {
  const res = await request(app)
    .post('/api/doctors')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Dr. Test',
      email: 'dr.test@example.com',
      specialty: 'Cardiologist',
      fee: 1000,
      availableDays: ['Monday'],
      availableSlots: ['10:00 AM', '10:30 AM'],
      ...overrides
    });
  return res.body;
};

describe('Health check', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  test('register returns 201, a token, and never echoes the password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe', email: 'jane@example.com', password: 'secret123'
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('cannot self-assign admin role at registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky', email: 'sneaky@example.com', password: 'secret123', role: 'admin'
    });
    expect(res.body.user.role).toBe('patient');
  });

  test('duplicate email registration returns 400', async () => {
    await registerAndLogin();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup', email: 'patient@example.com', password: 'password123'
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test('login with correct credentials succeeds', async () => {
    await registerAndLogin();
    const res = await request(app).post('/api/auth/login').send({
      email: 'patient@example.com', password: 'password123'
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('login with wrong password returns 401', async () => {
    await registerAndLogin();
    const res = await request(app).post('/api/auth/login').send({
      email: 'patient@example.com', password: 'wrongpass'
    });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me returns the user without a password when authenticated', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('patient@example.com');
    expect(res.body.user.password).toBeUndefined();
  });
});

describe('Doctors + admin-only protection', () => {
  test('creating a doctor without a token is rejected', async () => {
    const res = await request(app).post('/api/doctors').send({ name: 'X', email: 'x@x.com', specialty: 'Y', fee: 1 });
    expect(res.status).toBe(401);
  });

  test('creating a doctor as a regular patient is forbidden', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', email: 'x@x.com', specialty: 'Y', fee: 1 });
    expect(res.status).toBe(403);
  });

  test('admin can create, list, fetch, update, and delete a doctor', async () => {
    const { token: adminToken } = await registerAdmin();
    const created = await createDoctorDirect(adminToken);
    expect(created.name).toBe('Dr. Test');

    const list = await request(app).get('/api/doctors');
    expect(list.status).toBe(200);
    expect(list.body.some((d) => d._id === created._id)).toBe(true);

    const fetched = await request(app).get(`/api/doctors/${created._id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.specialty).toBe('Cardiologist');

    const updated = await request(app)
      .put(`/api/doctors/${created._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fee: 1500 });
    expect(updated.status).toBe(200);
    expect(updated.body.fee).toBe(1500);

    const deleted = await request(app)
      .delete(`/api/doctors/${created._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);

    const afterDelete = await request(app).get(`/api/doctors/${created._id}`);
    expect(afterDelete.status).toBe(404);
  });

  test('doctor search/filter query params work', async () => {
    const { token: adminToken } = await registerAdmin();
    await createDoctorDirect(adminToken, { name: 'Dr. Cardio', specialty: 'Cardiologist', fee: 1000, email: 'a@a.com' });
    await createDoctorDirect(adminToken, { name: 'Dr. Skin', specialty: 'Dermatologist', fee: 500, email: 'b@b.com' });

    const bySpecialty = await request(app).get('/api/doctors?specialty=Dermatologist');
    expect(bySpecialty.body.length).toBe(1);
    expect(bySpecialty.body[0].name).toBe('Dr. Skin');

    const byMaxPrice = await request(app).get('/api/doctors?maxPrice=600');
    expect(byMaxPrice.body.length).toBe(1);
    expect(byMaxPrice.body[0].name).toBe('Dr. Skin');

    const bySearch = await request(app).get('/api/doctors?search=cardio');
    expect(bySearch.body.length).toBe(1);
    expect(bySearch.body[0].name).toBe('Dr. Cardio');
  });
});

describe('Appointment booking + double-booking prevention', () => {
  let adminToken, doctor, patientToken;
  const futureDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0];
  })();

  beforeEach(async () => {
    ({ token: adminToken } = await registerAdmin());
    doctor = await createDoctorDirect(adminToken);
    ({ token: patientToken } = await registerAndLogin());
  });

  const bookingPayload = (overrides = {}) => ({
    doctorId: doctor._id,
    date: futureDate,
    time: '10:00 AM',
    patientName: 'Test Patient',
    patientPhone: '9999999999',
    patientEmail: 'patient@example.com',
    age: 30,
    gender: 'male',
    reason: 'Checkup',
    ...overrides
  });

  test('a logged-in patient can book an available slot', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(bookingPayload());
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('upcoming');
    expect(res.body.doctor.name).toBe('Dr. Test');
    expect(res.body.fee).toBe(1000);
  });

  test('booking requires authentication', async () => {
    const res = await request(app).post('/api/appointments').send(bookingPayload());
    expect(res.status).toBe(401);
  });

  test('booking the same doctor+date+time twice is rejected with a friendly message', async () => {
    const first = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(bookingPayload());
    expect(first.status).toBe(201);

    const { token: otherPatientToken } = await registerAndLogin({ email: 'other@example.com' });
    const second = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .send(bookingPayload({ patientEmail: 'other@example.com' }));

    expect(second.status).toBe(409);
    expect(second.body.message).toBe('This appointment slot is no longer available.');
  });

  test('cannot book a slot the doctor does not offer', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(bookingPayload({ time: '11:45 PM' }));
    expect(res.status).toBe(400);
  });

  test('cannot book an appointment in the past', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(bookingPayload({ date: '2020-01-01' }));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  test('a cancelled slot frees up for re-booking', async () => {
    const booked = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(bookingPayload());

    await request(app)
      .put(`/api/appointments/${booked.body._id}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);

    const { token: otherPatientToken } = await registerAndLogin({ email: 'other2@example.com' });
    const rebooked = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${otherPatientToken}`)
      .send(bookingPayload({ patientEmail: 'other2@example.com' }));
    expect(rebooked.status).toBe(201);
  });

  test('patient can view and cancel their own appointment, with a confirmation-style guard', async () => {
    const booked = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(bookingPayload());

    const mine = await request(app).get('/api/appointments/my').set('Authorization', `Bearer ${patientToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.length).toBe(1);
    expect(mine.body[0].doctor.name).toBe('Dr. Test');

    const cancel = await request(app)
      .put(`/api/appointments/${booked.body._id}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe('cancelled');

    // cancelling an already-cancelled appointment should be rejected
    const cancelAgain = await request(app)
      .put(`/api/appointments/${booked.body._id}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(cancelAgain.status).toBe(400);
  });

  test('a patient cannot cancel someone else\'s appointment', async () => {
    const booked = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(bookingPayload());

    const { token: intruderToken } = await registerAndLogin({ email: 'intruder@example.com' });
    const res = await request(app)
      .put(`/api/appointments/${booked.body._id}/cancel`)
      .set('Authorization', `Bearer ${intruderToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Admin dashboard', () => {
  test('stats and appointment list are admin-only and return correct shape', async () => {
    const { token: adminToken } = await registerAdmin();
    const doctor = await createDoctorDirect(adminToken);
    const { token: patientToken } = await registerAndLogin();

    const futureDate = (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })();
    const booked = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctor._id, date: futureDate, time: '10:00 AM',
        patientName: 'Test Patient', patientPhone: '999', patientEmail: 'patient@example.com',
        age: 25, gender: 'female'
      });

    const forbidden = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${patientToken}`);
    expect(forbidden.status).toBe(403);

    const stats = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(stats.status).toBe(200);
    expect(stats.body.totalDoctors).toBe(1);
    expect(stats.body.totalAppointments).toBe(1);
    expect(stats.body.upcomingAppointments).toBe(1);

    const allAppts = await request(app).get('/api/admin/appointments').set('Authorization', `Bearer ${adminToken}`);
    expect(allAppts.status).toBe(200);
    expect(allAppts.body.length).toBe(1);
    expect(allAppts.body[0].patient.name).toBe('Test Patient');

    const statusUpdate = await request(app)
      .put(`/api/appointments/${booked.body._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });
    expect(statusUpdate.status).toBe(200);
    expect(statusUpdate.body.status).toBe('completed');
  });
});
