export interface LRUCache<K, V> {
  get(key: K): V | null;
  set(key: K, value: V): void;
}