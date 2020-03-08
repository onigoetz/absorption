const cacheManager = require("cache-manager");
const fsStore = require("cache-manager-fs-hash");
const findCacheDir = require("find-cache-dir");

module.exports = cacheManager.caching({
  store: fsStore,
  options: {
    ttl: 60 * 60 * 24 * 90, // 3 months lifetime (in seconds)
    path: findCacheDir({ name: "absorption", create: true }),
    subdirs: true
  }
});
