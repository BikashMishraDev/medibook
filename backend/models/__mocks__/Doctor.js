const { collections, nextId } = require('./__store');
const { matches } = require('./__helpers');

class FindQuery {
  constructor(docs) { this._docs = docs; }
  sort(sortSpec) {
    const [[field, dir]] = Object.entries(sortSpec || { createdAt: -1 });
    this._docs = [...this._docs].sort((a, b) => (a[field] > b[field] ? 1 : -1) * dir);
    return this;
  }
  then(resolve) { resolve(this._docs.map((d) => ({ ...d }))); }
}

class SingleQuery {
  constructor(doc) { this._doc = doc; }
  then(resolve) { resolve(this._doc ? { ...this._doc } : null); }
}

const throwIfDuplicateEmail = (email, ignoreId) => {
  const dup = [...collections.doctors.values()].find((d) => d.email === email && d._id !== ignoreId);
  if (dup) {
    const err = new Error('E11000 duplicate key error');
    err.code = 11000;
    throw err;
  }
};

const Doctor = {
  async create(data) {
    throwIfDuplicateEmail(data.email);
    const _id = nextId();
    const doc = {
      _id, createdAt: new Date(), rating: 4.5, availableDays: [], availableSlots: [],
      qualification: '', hospital: '', bio: '', profileImage: '', experience: 0,
      ...data
    };
    collections.doctors.set(_id, doc);
    return { ...doc };
  },
  find(query = {}) {
    const docs = [...collections.doctors.values()].filter((d) => matches(d, query));
    return new FindQuery(docs);
  },
  findById(id) {
    return new SingleQuery(collections.doctors.get(id));
  },
  async findByIdAndUpdate(id, update) {
    const existing = collections.doctors.get(id);
    if (!existing) return null;
    if (update.email) throwIfDuplicateEmail(update.email, id);
    const updated = { ...existing, ...update };
    collections.doctors.set(id, updated);
    return { ...updated };
  },
  async findByIdAndDelete(id) {
    const existing = collections.doctors.get(id);
    if (!existing) return null;
    collections.doctors.delete(id);
    return { ...existing };
  },
  async countDocuments(query = {}) {
    return [...collections.doctors.values()].filter((d) => matches(d, query)).length;
  }
};

module.exports = Doctor;
