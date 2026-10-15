const { collections, nextId } = require('./__store');
const { matches, populateDoc } = require('./__helpers');

const refLookup = (path, id) => {
  if (path === 'doctor') return collections.doctors.get(id);
  if (path === 'patient') return collections.users.get(id);
  return undefined;
};

const withInstanceMethods = (doc) => {
  doc.save = async function save() {
    collections.appointments.set(this._id, { ...this, save: undefined, populate: undefined });
    return this;
  };
  doc.populate = async function populate(paths, select) {
    const populated = populateDoc(this, paths, refLookup, select);
    Object.assign(this, populated);
    return this;
  };
  return doc;
};

class FindQuery {
  constructor(docs) { this._docs = docs; this._populateCalls = []; }
  populate(paths, select) { this._populateCalls.push([paths, select]); return this; }
  sort(sortSpec) {
    const [[field, dir]] = Object.entries(sortSpec || { createdAt: -1 });
    this._docs = [...this._docs].sort((a, b) => (a[field] > b[field] ? 1 : -1) * dir);
    return this;
  }
  then(resolve) {
    const out = this._docs.map((d) => {
      let clone = { ...d };
      this._populateCalls.forEach(([paths, select]) => {
        clone = populateDoc(clone, paths, refLookup, select);
      });
      return clone;
    });
    resolve(out);
  }
}

class SingleQuery {
  constructor(doc) { this._doc = doc; this._populateCalls = []; }
  populate(paths, select) { this._populateCalls.push([paths, select]); return this; }
  then(resolve) {
    if (!this._doc) return resolve(null);
    let clone = { ...this._doc };
    this._populateCalls.forEach(([paths, select]) => {
      clone = populateDoc(clone, paths, refLookup, select);
    });
    resolve(withInstanceMethods(clone));
  }
}

const throwIfDuplicateSlot = (doctor, date, time, ignoreId) => {
  const dup = [...collections.appointments.values()].find(
    (a) => a._id !== ignoreId && a.doctor === doctor && a.date === date && a.time === time && a.status !== 'cancelled'
  );
  if (dup) {
    const err = new Error('E11000 duplicate key error');
    err.code = 11000;
    throw err;
  }
};

const Appointment = {
  async create(data) {
    throwIfDuplicateSlot(data.doctor, data.date, data.time);
    const _id = nextId();
    const doc = { _id, createdAt: new Date(), status: 'upcoming', ...data };
    collections.appointments.set(_id, doc);
    return withInstanceMethods({ ...doc });
  },
  findOne(query = {}) {
    const doc = [...collections.appointments.values()].find((a) => matches(a, query));
    return new SingleQuery(doc);
  },
  find(query = {}) {
    const docs = [...collections.appointments.values()].filter((a) => matches(a, query));
    return new FindQuery(docs);
  },
  findById(id) {
    return new SingleQuery(collections.appointments.get(id));
  },
  findByIdAndUpdate(id, update) {
    // Not async: appointmentController chains .populate(...) directly on the return
    // value, so this must return a thenable SingleQuery like Mongoose's Query object.
    const existing = collections.appointments.get(id);
    if (!existing) return new SingleQuery(null);
    const updated = { ...existing, ...update };
    collections.appointments.set(id, updated);
    return new SingleQuery(updated);
  },
  async countDocuments(query = {}) {
    return [...collections.appointments.values()].filter((a) => matches(a, query)).length;
  }
};

module.exports = Appointment;
