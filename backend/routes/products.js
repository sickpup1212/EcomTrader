/**
 * Product Routes
 * Pipeline Rivers - Public product endpoints
 *
 * Enhanced with comprehensive filtering, search, and category support
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const productController = require('../controllers/productController');
const validateRequest = require('../middleware/validateRequest');
const { cacheProducts, cacheSearch, invalidateProduct } = require('../middleware/cache');

/**
 * Get all products with filtering and pagination
 * GET /api/products
 */
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query cannot be empty'),
  query('category')
    .optional(),
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean'),
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('featured must be a boolean'),
  query('sort')
    .optional()
    .isIn(['name', 'price', 'stock', 'date', 'rating'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc')
], validateRequest, cacheProducts, productController.getProducts);

/**
 * Search products with advanced filters
 * GET /api/products/search
 */
router.get('/search', [
  query('q')
    .notEmpty()
    .trim()
    .withMessage('Search query is required'),
  query('category')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID format'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['name', 'price', 'date', 'rating'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc')
], validateRequest, cacheSearch, productController.searchProducts);

/**
 * Get featured products
 * GET /api/products/featured
 */
router.get('/featured', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('category')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID format')
], validateRequest, cacheProducts, productController.getFeaturedProducts);

/**
 * Get product categories with product counts
 * GET /api/products/categories
 */
router.get('/categories', [
  query('includeEmpty')
    .optional()
    .isBoolean()
    .withMessage('includeEmpty must be a boolean')
], validateRequest, cacheProducts, productController.getProductCategories);

/**
 * Get product categories tree structure
 * GET /api/products/categories/tree
 */
router.get('/categories/tree', cacheProducts, productController.getProductCategoriesTree);

/**
 * Get products by category with hierarchy support
 * GET /api/products/category/:categoryId
 */
router.get('/category/:categoryId', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['name', 'price', 'date', 'rating'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  query('includeSubcategories')
    .optional()
    .isBoolean()
    .withMessage('includeSubcategories must be a boolean')
], validateRequest, productController.getProductsByCategory);

/**
 * Get product by SKU
 * GET /api/products/sku/:sku
 */
router.get('/sku/:sku', productController.getProductBySku);

/**
 * Get product by slug
 * GET /api/products/slug/:slug
 */
router.get('/slug/:slug', productController.getProductBySlug);

/**
 * Get single product
 * GET /api/products/:id
 */
router.get('/:id', productController.getProduct);

/**
 * Get product inventory status (public version)
 * GET /api/products/:id/inventory
 */
router.get('/:id/inventory', productController.getProductInventory);

/**
 * Get related products (same category, different product)
 * GET /api/products/:id/related
 */
router.get('/:id/related', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], validateRequest, productController.getRelatedProducts);

/**
 * Get product reviews
 * GET /api/products/:id/reviews
 */
router.get('/:id/reviews', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('sort')
    .optional()
    .isIn(['date', 'rating'])
    .withMessage('Sort must be date or rating'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc')
], validateRequest, productController.getProductReviews);

/**
 * Create product review
 * POST /api/products/:id/reviews
 */
router.post(
  '/:id/reviews',
  [
    body('authorName')
      .trim()
      .notEmpty()
      .withMessage('Author name is required')
      .isLength({ max: 100 })
      .withMessage('Author name cannot exceed 100 characters'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Review content is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review content must be between 10 and 2000 characters'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Review title cannot exceed 200 characters')
  ],
  validateRequest,
  productController.createReview
);

module.exports = router;
