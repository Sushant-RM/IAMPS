const cache = new Map();

function getCached(text) {
  return cache.get(text);
}

function setCache(text, value) {
  cache.set(text, value);
}

module.exports = { getCached, setCache };
