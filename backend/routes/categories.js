/**
 * Category Routes
 * Pipeline Rivers - Public category endpoints
 *
 * Enhanced with comprehensive validation and category hierarchy support
 */

const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const validateRequest = require('../middleware/validateRequest');
const { cacheCategories } = require('../middleware/cache');

/**
 * Get all categories (public)
 * GET /api/categories
 */
router.get('/', [
  query('includeEmpty')
    .optional()
    .isBoolean()
    .withMessage('includeEmpty must be a boolean')
], validateRequest, cacheCategories, categoryController.getCategories);

/**
 * Get category tree (hierarchical structure)
 * GET /api/categories/tree
 */
router.get('/tree', [
  query('includeEmpty')
    .optional()
    .isBoolean()
    .withMessage('includeEmpty must be a boolean'),
  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive must be a boolean')
], validateRequest, cacheCategories, categoryController.getCategoryTree);

/**
 * Get category breadcrumbs
 * GET /api/categories/:id/breadcrumbs
 */
router.get('/:id/breadcrumbs', categoryController.getCategoryBreadcrumbs);

/**
 * Get single category by ID
 * GET /api/categories/:id
 */
router.get('/:id', categoryController.getCategory);

/**
 * Get category by slug
 * GET /api/categories/slug/:slug
 */
router.get('/slug/:slug', categoryController.getCategoryBySlug);

/**
 * Get products in category with hierarchy support
 * GET /api/categories/:id/products
 */
router.get('/:id/products', [
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
  query('sort')
    .optional()
    .isIn(['name', 'price', 'date', 'rating', 'stock'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
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
  query('includeSubcategories')
    .optional()
    .isBoolean()
    .withMessage('includeSubcategories must be a boolean')
], validateRequest, categoryController.getCategoryProducts);

module.exports = router;