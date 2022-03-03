function cloneDeep(val) {
  if (Array.isArray(val)) {
    return cloneArrayDeep(val);
  } else if (typeof val === 'object' && val !== null) {
    return cloneObjectDeep(val);
  }
  return val;
}

function cloneObjectDeep(val) {
  if (Object.getPrototypeOf(val) === Object.prototype) {
    const res = {};
    for (const key in val) {
      res[key] = cloneDeep(val[key]);
    }
    return res;
  }
  return val;
}

function cloneArrayDeep(val) {
  return val.map(item => cloneDeep(item));
}

export default cloneDeep;
