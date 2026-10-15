// Minimal query-matching + populate helpers shared by the fake models.

const getField = (doc, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), doc);

const matchesClause = (doc, field, condition) => {
  const value = getField(doc, field);
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if ('$regex' in condition) {
      const flags = condition.$options || '';
      return new RegExp(condition.$regex, flags).test(String(value ?? ''));
    }
    let ok = true;
    if ('$gte' in condition) ok = ok && value >= condition.$gte;
    if ('$lte' in condition) ok = ok && value <= condition.$lte;
    if ('$ne' in condition) ok = ok && value !== condition.$ne;
    return ok;
  }
  return value === condition;
};

const matches = (doc, query = {}) => {
  return Object.entries(query).every(([key, condition]) => {
    if (key === '$or') {
      return condition.some((clause) =>
        Object.entries(clause).every(([k, c]) => matchesClause(doc, k, c))
      );
    }
    return matchesClause(doc, key, condition);
  });
};

// Returns a shallow clone of `doc` with `paths` (space-separated refs) replaced by the
// referenced document from `refCollection`, honoring an optional `-field` select string.
const populateDoc = (doc, paths, refLookup, select) => {
  const clone = { ...doc };
  const excluded = (select || '').split(' ').filter((s) => s.startsWith('-')).map((s) => s.slice(1));
  paths.split(' ').forEach((path) => {
    const refId = doc[path];
    const refDoc = refLookup(path, refId);
    if (refDoc) {
      const refClone = { ...refDoc };
      excluded.forEach((f) => delete refClone[f]);
      clone[path] = refClone;
    }
  });
  return clone;
};

module.exports = { matches, populateDoc };
