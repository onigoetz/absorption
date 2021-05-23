import cacheManager from "cache-manager";
import fsStore from "cache-manager-fs-hash";
import findCacheDir from "find-cache-dir";

export default cacheManager.caching({
  store: fsStore,
  options: {
    ttl: 60 * 60 * 24 * 90, // 3 months lifetime (in seconds)
    path: findCacheDir({ name: "absorption", create: true }),
    subdirs: true
  }
});
