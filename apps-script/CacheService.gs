function getApiCache() {
  return CacheService.getScriptCache();
}

function registerCacheKey(key, count) {
  var cache = getApiCache();
  var registry;
  try {
    registry = JSON.parse(cache.get(AP_CONFIG.CACHE_REGISTRY_KEY) || '{}');
  } catch (error) {
    registry = {};
  }
  registry[key] = count;
  cache.put(AP_CONFIG.CACHE_REGISTRY_KEY, JSON.stringify(registry), AP_CONFIG.CACHE_SECONDS);
}

function readChunkedCache(key) {
  try {
    var cache = getApiCache();
    var manifest = cache.get(key + ':manifest');
    if (!manifest) return null;

    var count = Number(manifest);
    if (!count || count < 1) return null;

    var value = '';
    for (var index = 0; index < count; index += 1) {
      var chunk = cache.get(key + ':' + index);
      if (chunk === null) return null;
      value += chunk;
    }

    return JSON.parse(value);
  } catch (error) {
    logApiEvent('warning', 'cache-read', { key: key, message: error.message || String(error) });
    return null;
  }
}

function writeChunkedCache(key, value) {
  try {
    var serialized = JSON.stringify(value);
    var chunks = [];
    for (var offset = 0; offset < serialized.length; offset += AP_CONFIG.CACHE_CHUNK_SIZE) {
      chunks.push(serialized.slice(offset, offset + AP_CONFIG.CACHE_CHUNK_SIZE));
    }

    var cache = getApiCache();
    cache.put(key + ':manifest', String(chunks.length), AP_CONFIG.CACHE_SECONDS);
    chunks.forEach(function(chunk, index) {
      cache.put(key + ':' + index, chunk, AP_CONFIG.CACHE_SECONDS);
    });
    registerCacheKey(key, chunks.length);
  } catch (error) {
    logApiEvent('warning', 'cache-write', { key: key, message: error.message || String(error) });
  }
}

function clearApiCache() {
  try {
    var cache = getApiCache();
    var registry = JSON.parse(cache.get(AP_CONFIG.CACHE_REGISTRY_KEY) || '{}');
    var keys = [AP_CONFIG.CACHE_REGISTRY_KEY];
    Object.keys(registry).forEach(function(key) {
      keys.push(key + ':manifest');
      for (var index = 0; index < Number(registry[key] || 0); index += 1) keys.push(key + ':' + index);
    });
    cache.removeAll(keys);
  } catch (error) {
    logApiEvent('warning', 'cache-clear', { message: error.message || String(error) });
  }
}
