import { CacheLimits, createCacheLimits } from './CacheLimits.js';
import { LRUCache } from './LRUCache.js';

function createLRUCache<K, V>(capacity: number): LRUCache<K, V> {
  interface CacheNode {
    key: K;
    value: V;
    prev: CacheNode | null;
    next: CacheNode | null;
  }

  const limits: CacheLimits = createCacheLimits(capacity);
  const cache: Map<K, CacheNode> = new Map();
  const head: CacheNode = { key: undefined as unknown as K, value: undefined as unknown as V, prev: null, next: null };
  const tail: CacheNode = { key: undefined as unknown as K, value: undefined as unknown as V, prev: null, next: null };
  head.next = tail;
  tail.prev = head;

  function remove(node: CacheNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  function add(node: CacheNode): void {
    node.next = head.next;
    node.prev = head;
    head.next!.prev = node;
    head.next = node;
  }

  return {
    get(key: K): V | -1 {
      if (cache.has(key)) {
        const node = cache.get(key)!;
        remove(node);
        add(node);
        return node.value;
      }
      return -1;
    },
    set(key: K, value: V): void {
      if (cache.has(key)) {
        remove(cache.get(key)!);
      }
      const node: CacheNode = { key, value, prev: null, next: null };
      add(node);
      cache.set(key, node);
      if (cache.size > limits.getMaxSize()) {
        const lru = tail.prev!;
        remove(lru);
        cache.delete(lru.key);
      }
    },
  };
}

export { createLRUCache };