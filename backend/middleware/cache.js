/**
 * Caching Middleware
 * Pipeline Rivers - Data flow optimization
 *
 * Cache frequently accessed data to improve response times
 * like reservoirs storing water for quick access
 */

const NodeCache = require('node-cache');
const crypto = require('crypto');

// Create cache instances for different purposes
const productCache = new NodeCache({
  stdTTL: 300, // 5 minutes for products
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Performance optimization
});

const categoryCache = new NodeCache({
  stdTTL: 600, // 10 minutes for categories
  checkperiod: 120,
  useClones: false
});

const searchCache = new NodeCache({
  stdTTL: 180, // 3 minutes for search results
  checkperiod: 30,
  useClones: false
});

const statsCache = new NodeCache({
  stdTTL: 900, // 15 minutes for statistics
  checkperiod: 300,
  useClones: false
});

/**
 * Generate cache key from request
 */
function generateCacheKey(req, additionalParams = {}) {
  const keyData = {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    params: req.params,
    ...additionalParams
  };

  const keyString = JSON.stringify(keyData);
  return crypto.createHash('md5').update(keyString).digest('hex');
}

/**
 * Generic caching middleware
 */
function cacheMiddleware(cache, ttl) {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if no-cache header is present
    if (req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const key = generateCacheKey(req);

    // Check if data exists in cache
    const cachedData = cache.get(key);
    if (cachedData) {
      console.log(`[CACHE HIT] ${req.method} ${req.originalUrl}`);
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const cacheTTL = ttl || cache.options.stdTTL;
        cache.set(key, data, cacheTTL);
        console.log(`[CACHE SET] ${req.method} ${req.originalUrl} - TTL: ${cacheTTL}s`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Product-specific caching middleware
 */
function cacheProducts(req, res, next) {
  return cacheMiddleware(productCache, 300)(req, res, next);
}

/**
 * Category-specific caching middleware
 */
function cacheCategories(req, res, next) {
  return cacheMiddleware(categoryCache, 600)(req, res, next);
}

/**
 * Search result caching middleware
 */
function cacheSearch(req, res, next) {
  return cacheMiddleware(searchCache, 180)(req, res, next);
}

/**
 * Statistics caching middleware
 */
function cacheStats(req, res, next) {
  return cacheMiddleware(statsCache, 900)(req, res, next);
}

/**
 * Cache invalidation functions
 */
function invalidateProduct(productId) {
  const keys = productCache.keys().filter(key =>
    key.includes(productId) || productCache.get(key)?.products?.some(p => p.id === productId)
  );

  keys.forEach(key => {
    productCache.del(key);
    console.log(`[CACHE INVALIDATE] Product: ${productId} - Key: ${key}`);
  });

  // Also invalidate related search results
  const searchKeys = searchCache.keys();
  searchCache.del(searchKeys);
}

function invalidateCategory(categoryId) {
  // Invalidate category cache
  const categoryKeys = categoryCache.keys().filter(key =>
    key.includes(categoryId)
  );

  categoryKeys.forEach(key => {
    categoryCache.del(key);
    console.log(`[CACHE INVALIDATE] Category: ${categoryId} - Key: ${key}`);
  });

  // Invalidate related products and search
  const productKeys = productCache.keys().filter(key =>
    key.includes(categoryId) || productCache.get(key)?.products?.some(p => p.category?.id === categoryId)
  );

  productKeys.forEach(key => {
    productCache.del(key);
  });

  const searchKeys = searchCache.keys();
  searchCache.del(searchKeys);

  // Invalidate stats
  const statsKeys = statsCache.keys();
  statsCache.del(statsKeys);
}

function invalidateAll() {
  productCache.flushAll();
  categoryCache.flushAll();
  searchCache.flushAll();
  statsCache.flushAll();
  console.log('[CACHE INVALIDATE] All caches cleared');
}

/**
 * Cache statistics and monitoring
 */
function getCacheStats() {
  return {
    products: {
      keys: productCache.keys().length,
      stats: productCache.getStats()
    },
    categories: {
      keys: categoryCache.keys().length,
      stats: categoryCache.getStats()
    },
    search: {
      keys: searchCache.keys().length,
      stats: searchCache.getStats()
    },
    stats: {
      keys: statsCache.keys().length,
      stats: statsCache.getStats()
    }
  };
}

/**
 * Cache warming function for common data
 */
async function warmupCache() {
  console.log('[CACHE] Starting cache warmup...');

  // Warm up categories (most frequently accessed)
  try {
    const Category = require('../models/Category');
    const categories = await Category.getAll();
    const categoryTree = await Category.getTree();
    const categoriesWithCounts = await Category.getWithCounts();

    const cacheKey = 'categories:all';
    categoryCache.set(cacheKey, categories, 600);

    const treeKey = 'categories:tree';
    categoryCache.set(treeKey, categoryTree, 600);

    const countsKey = 'categories:counts';
    categoryCache.set(countsKey, categoriesWithCounts, 600);

    console.log('[CACHE] Categories warmed up');
  } catch (error) {
    console.error('[CACHE] Failed to warm up categories:', error.message);
  }

  // Warm up featured products
  try {
    const Product = require('../models/Product');
    const { products } = await Product.getAll({ featured: true, limit: 12 });

    const featuredKey = 'products:featured';
    productCache.set(featuredKey, { success: true, data: { products } }, 300);

    console.log('[CACHE] Featured products warmed up');
  } catch (error) {
    console.error('[CACHE] Failed to warm up featured products:', error.message);
  }

  console.log('[CACHE] Cache warmup completed');
}

/**
 * Periodic cache maintenance
 */
function startCacheMaintenance() {
  // Run maintenance every 5 minutes
  setInterval(() => {
    const stats = getCacheStats();

    // Log cache statistics
    console.log('[CACHE STATS]', JSON.stringify(stats, null, 2));

    // Clean up expired entries (handled automatically by node-cache)
    // But we can add custom cleanup logic here if needed

  }, 5 * 60 * 1000); // 5 minutes
}

module.exports = {
  // Middleware functions
  cacheProducts,
  cacheCategories,
  cacheSearch,
  cacheStats,
  cacheMiddleware,

  // Cache management
  invalidateProduct,
  invalidateCategory,
  invalidateAll,
  getCacheStats,
  warmupCache,
  startCacheMaintenance,

  // Cache instances (for direct access if needed)
  productCache,
  categoryCache,
  searchCache,
  statsCache
};