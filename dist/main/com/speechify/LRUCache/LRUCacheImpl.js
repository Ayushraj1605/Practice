import { createCacheLimits } from './CacheLimits.js';
function createLRUCache(capacity) {
    const limits = createCacheLimits(capacity);
    const cache = new Map();
    const head = { key: undefined, value: undefined, prev: null, next: null };
    const tail = { key: undefined, value: undefined, prev: null, next: null };
    head.next = tail;
    tail.prev = head;
    function remove(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    function add(node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
    return {
        get(key) {
            if (cache.has(key)) {
                const node = cache.get(key);
                remove(node);
                add(node);
                return node.value;
            }
            return null;
        },
        set(key, value) {
            if (cache.has(key)) {
                remove(cache.get(key));
            }
            const node = { key, value, prev: null, next: null };
            add(node);
            cache.set(key, node);
            if (cache.size > limits.getMaxSize()) {
                const lru = tail.prev;
                remove(lru);
                cache.delete(lru.key);
            }
        },
    };
}
export { createLRUCache };
