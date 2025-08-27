import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { LRUCache } from '../main/com/speechify/LRUCache/LRUCache';

describe('LruCache', () => {
  let lruCacheProvider: { create: <K, V>(capacity: number) => LRUCache<K, V> };

  before(async () => {
    const module = await import('../main/com/speechify/LRUCache/LRUCacheProvider');
    lruCacheProvider = module.lruCacheProvider;
  });

  test('should handle basic operations', (t) => {
    const cache = lruCacheProvider.create<number, string>(2);
    cache.set(1, 'one');
    cache.set(2, 'two');
    assert.strictEqual(cache.get(1), 'one');
    cache.set(3, 'three'); // Evicts key 2
    assert.strictEqual(cache.get(2), -1);
    cache.set(4, 'four'); // Evicts key 1
    assert.strictEqual(cache.get(1), -1);
    assert.strictEqual(cache.get(3), 'three');
  });

  test('should handle zero capacity', (t) => {
    assert.throws(() => lruCacheProvider.create<number, string>(0), /Max size must be positive/);
    const cache = lruCacheProvider.create<number, string>(1);
    assert.strictEqual(cache.get(1), -1);
  });

  test('should handle single item', (t) => {
    const cache = lruCacheProvider.create<number, string>(1);
    cache.set(1, 'one');
    assert.strictEqual(cache.get(1), 'one');
    cache.set(2, 'two'); // Evicts key 1
    assert.strictEqual(cache.get(1), -1);
    assert.strictEqual(cache.get(2), 'two');
  });
});