const { collections, nextId } = require('./__store');
const { matches } = require('./__helpers');

class QueryResult {
  // Mirrors the real schema's `password: { select: false }` — excluded by default,
  // only included if the caller explicitly does .select('+password').
  constructor(doc) { this._doc = doc; this._includePassword = false; }
  select(fields) {
    if (fields && fields.includes('+password')) this._includePassword = true;
    return this;
  }
  then(resolve, reject) {
    try {
      if (!this._doc) return resolve(null);
      const clone = { ...this._doc };
      if (!this._includePassword) delete clone.password;
      resolve(withInstanceMethods(clone));
    } catch (e) { reject(e); }
  }
}

const withInstanceMethods = (doc) => {
  if (!doc) return doc;
  doc.save = async function save() {
    collections.users.set(this._id, { ...this });
    return this;
  };
  return doc;
};

const User = {
  async create(data) {
    const _id = nextId();
    const doc = { _id, createdAt: new Date(), role: 'patient', phone: '', ...data };
    collections.users.set(_id, doc);
    return withInstanceMethods({ ...doc });
  },
  findOne(query) {
    const doc = [...collections.users.values()].find((u) => matches(u, query));
    return new QueryResult(doc);
  },
  findById(id) {
    const doc = collections.users.get(id);
    return new QueryResult(doc);
  },
  async countDocuments(query = {}) {
    return [...collections.users.values()].filter((u) => matches(u, query)).length;
  }
};

module.exports = User;
