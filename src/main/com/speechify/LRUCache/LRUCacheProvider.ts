import { LRUCache } from './LRUCache.js';
import { createLRUCache } from './LRUCacheImpl.js';

const lruCacheProvider = {
  create<K, V>(capacity: number): LRUCache<K, V> {
    return createLRUCache<K, V>(capacity);
  },
};

export { lruCacheProvider };