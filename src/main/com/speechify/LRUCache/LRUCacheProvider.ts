import { LRUCache } from './LRUCache';
import { createLRUCache } from './LRUCacheImpl';

const lruCacheProvider = {
  create<K, V>(capacity: number): LRUCache<K, V> {
    return createLRUCache<K, V>(capacity);
  },
};

export { lruCacheProvider };