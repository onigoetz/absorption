import DiskStore from "cache-manager-fs-hash";
import findCacheDir from "find-cache-dir";

const store = DiskStore.create({
  ttl: 60 * 60 * 24 * 90, // 3 months lifetime (in seconds)
  path: findCacheDir({ name: "absorption", create: true }),
  subdirs: true,
});

export default {
  async wrap(key, fn) {
    const value = await store.get(key);
    if (value === undefined) {
      const result = await fn();
      await store.set(key, result);
      return result;
    }
    return value;
  },
  store,
  del(key) {
    return store.del(key);
  },
  get(key) {
    return store.get(key);
  },
  set(key, value, ttl) {
    return store.set(key, value, ttl);
  },
  reset() {
    return store.reset();
  },
};
