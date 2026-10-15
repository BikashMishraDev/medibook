// Shared in-memory "database" used by the fake Mongoose models in this folder.
// This lets us run the real Express app/controllers/routes through supertest
// without a live MongoDB, while still exercising real query/validation logic.
let counter = 0;
const nextId = () => `mockid_${(++counter).toString().padStart(6, '0')}`;

const collections = { users: new Map(), doctors: new Map(), appointments: new Map() };

const reset = () => {
  collections.users.clear();
  collections.doctors.clear();
  collections.appointments.clear();
  counter = 0;
};

module.exports = { collections, nextId, reset };
