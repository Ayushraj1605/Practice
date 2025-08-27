interface CacheLimits {
  getMaxSize(): number;
}

function createCacheLimits(maxSize: number): CacheLimits {
  if (maxSize <= 0) throw new Error('Max size must be positive');
  return { getMaxSize: () => maxSize };
}

export { createCacheLimits, CacheLimits };