// Small JSON Schema (draft-07 subset) validator, no dependencies. Enough for public/assets/characters/character.schema.json:
// type, enum, const, required, properties, additionalProperties(false), items, minItems, maxItems, minimum, maximum,
// exclusiveMinimum, minLength, pattern, oneOf, $ref (local "#/definitions/..."). Unknown keywords are ignored.
function typeOf(v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }

function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new Error('unsupported $ref ' + ref);
  return ref.slice(2).split('/').reduce((o, k) => o[k], root);
}

function check(root, schema, value, at, errors) {
  if (schema.$ref) { check(root, { ...resolveRef(root, schema.$ref), ...omit(schema, '$ref') }, value, at, errors); return; }
  if ('const' in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) { errors.push(`${at}: must be ${JSON.stringify(schema.const)}`); return; }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) { errors.push(`${at}: must be one of ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}`); return; }
  if (schema.oneOf) {
    const results = schema.oneOf.map((s) => { const e = []; check(root, s, value, at, e); return e; });
    const ok = results.filter((e) => e.length === 0).length;
    if (ok !== 1) {
      // report the most relevant branch: the one whose discriminating const matched, else the closest
      const best = results.map((e, i) => ({ e, i })).sort((a, b) => a.e.length - b.e.length)[0];
      errors.push(ok === 0 ? `${at}: does not match any allowed form (${best.e.slice(0, 2).join('; ')})` : `${at}: matches more than one form`);
    }
    return;
  }
  const t = schema.type;
  if (t) {
    const actual = typeOf(value);
    const okType = t === 'integer' ? (actual === 'number' && Number.isInteger(value)) : t === 'number' ? actual === 'number' : actual === t;
    if (!okType) { errors.push(`${at}: expected ${t}, got ${actual === 'number' && t === 'integer' ? 'non-integer number' : actual}`); return; }
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: ${value} is below the minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: ${value} is above the maximum ${schema.maximum}`);
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) errors.push(`${at}: ${value} must be greater than ${schema.exclusiveMinimum}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${at}: too short`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: "${value}" does not match ${schema.pattern}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: needs at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${at}: allows at most ${schema.maxItems} items`);
    if (schema.items) value.forEach((v, i) => check(root, schema.items, v, `${at}[${i}]`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const k of schema.required || []) if (!(k in value)) errors.push(`${at}: missing required "${k}"`);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (k in props) check(root, props[k], v, `${at}.${k}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${at}: unknown property "${k}"`);
    }
  }
}
const omit = (o, k) => Object.fromEntries(Object.entries(o).filter(([key]) => key !== k));

function validate(schema, value) {
  const errors = [];
  check(schema, schema, value, '$', errors);
  return errors;
}
module.exports = { validate };
