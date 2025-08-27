function createCacheLimits(maxSize) {
    if (maxSize <= 0)
        throw new Error('Max size must be positive');
    return { getMaxSize: () => maxSize };
}
export { createCacheLimits };
