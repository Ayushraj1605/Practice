export interface LRUCache<K, V> {
  get(key: K): V | -1;
  set(key: K, value: V): void;
}