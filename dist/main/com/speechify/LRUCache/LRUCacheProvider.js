import { createLRUCache } from './LRUCacheImpl.js';
const lruCacheProvider = {
    create(capacity) {
        return createLRUCache(capacity);
    },
};
export { lruCacheProvider };
