import { test } from 'node:test';
import assert from 'node:assert';
import { lruCacheProvider } from '../main/com/speechify/LRUCache/LRUCacheProvider.js';

test('get should return value for existing key', () => {
  const cache = lruCacheProvider.create<string, string>(10);
  cache.set('foo', 'bar');
  assert.strictEqual(cache.get('foo'), 'bar', 'Should return value for existing key');
});

test('get should return null for non-existent key', () => {
  const cache = lruCacheProvider.create<string, string>(10);
  cache.set('foo', 'bar');
  assert.strictEqual(cache.get('bar'), null, 'Should return null for non-existent key');
  assert.strictEqual(cache.get(''), null, 'Should return null for empty string key');
});

test('get should return value for many existing keys', () => {
  const cache = lruCacheProvider.create<string, string>(10);
  cache.set('foo', 'foo');
  cache.set('baz', 'baz');
  assert.strictEqual(cache.get('foo'), 'foo', 'Should return value for first key');
  assert.strictEqual(cache.get('baz'), 'baz', 'Should return value for second key');
});

test('get should return null for key not fitting max items count', () => {
  const cache = lruCacheProvider.create<string, string>(1);
  cache.set('foo', 'bar');
  cache.set('baz', 'bar');
  assert.strictEqual(cache.get('foo'), null, 'Should return null for evicted key');
  assert.strictEqual(cache.get('baz'), 'bar', 'Should return value for existing key');
});

test('get should return value for recreated key after it was previously removed', () => {
  const cache = lruCacheProvider.create<string, string>(1);
  cache.set('foo', 'bar');
  cache.set('baz', 'bar');
  cache.set('foo', 'bar');
  assert.strictEqual(cache.get('foo'), 'bar', 'Should return value for recreated key');
  assert.strictEqual(cache.get('baz'), null, 'Should return null for evicted key');
});

test('set should remove oldest key on reaching max items count if no get has been used', () => {
  const cache = lruCacheProvider.create<string, string>(1);
  cache.set('foo', 'bar');
  cache.set('baz', 'bar');
  assert.strictEqual(cache.get('foo'), null, 'Should return null for evicted key');
  assert.strictEqual(cache.get('baz'), 'bar', 'Should return value for existing key');
});

test('set should replace existing value and keep values for all keys when cache limit is reached', () => {
  const cache = lruCacheProvider.create<string, string>(3);
  cache.set('bax', 'par');
  cache.set('foo', 'bar1');
  cache.set('foo', 'bar2');
  cache.set('foo', 'bar3');
  cache.set('baz', 'bar');
  assert.strictEqual(cache.get('foo'), 'bar3', 'Should return updated value for overwritten key');
  assert.strictEqual(cache.get('bax'), 'par', 'Should return value for first key');
  assert.strictEqual(cache.get('baz'), 'bar', 'Should return value for new key');
});

test('set should remove least recently used key on reaching max items count', () => {
  const cache = lruCacheProvider.create<string, string>(2);
  cache.set('foo', 'bar');
  cache.set('bar', 'bar');
  cache.get('foo');
  cache.set('baz', 'bar');
  assert.strictEqual(cache.get('foo'), 'bar', 'Should return value for recently used key');
  assert.strictEqual(cache.get('bar'), null, 'Should return null for least recently used key');
  assert.strictEqual(cache.get('baz'), 'bar', 'Should return value for new key');
});

test('item is considered accessed when get is called', () => {
  const cache = lruCacheProvider.create<string, string>(2);
  cache.set('1key', '1value');
  cache.set('2key', '2value');
  cache.get('1key');
  cache.set('3key', '3value');
  assert.strictEqual(cache.get('1key'), '1value', 'Should return value for recently accessed key');
});