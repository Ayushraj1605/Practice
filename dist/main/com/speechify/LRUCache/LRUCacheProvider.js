import { createLRUCache } from './LRUCacheImpl';
const lruCacheProvider = {
    create(capacity) {
        return createLRUCache(capacity);
    },
};
export { lruCacheProvider };
