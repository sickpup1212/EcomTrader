/**
 * Admin Routes
 * Pipeline Rivers - Admin panel endpoints
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const validateRequest = require('../middleware/validateRequest');

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
router.get('/stats', adminController.getStats);

/**
 * List all products
 * GET /api/admin/products
 */
router.get('/products', adminController.listProducts);

/**
 * Get single product
 * GET /api/admin/products/:id
 */
router.get('/products/:id', adminController.getProduct);

/**
 * Create product
 * POST /api/admin/products
 */
router.post(
  '/products',
  [
    body('sku').notEmpty().withMessage('SKU is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('categoryId').notEmpty().withMessage('Category is required'),
    body('price.amount').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock.quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer')
  ],
  validateRequest,
  adminController.createProduct
);

/**
 * Update product
 * PUT /api/admin/products/:id
 */
router.put('/products/:id', adminController.updateProduct);

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
router.delete('/products/:id', adminController.deleteProduct);

/**
 * Bulk delete products
 * POST /api/admin/products/bulk-delete
 */
router.post(
  '/products/bulk-delete',
  [
    body('productIds').isArray({ min: 1 }).withMessage('productIds must be a non-empty array')
  ],
  validateRequest,
  adminController.bulkDeleteProducts
);

/**
 * Get all categories
 * GET /api/admin/categories
 */
router.get('/categories', adminController.getCategories);

/**
 * Get settings
 * GET /api/admin/settings
 */
router.get('/settings', adminController.getSettings);

/**
 * Update settings
 * PUT /api/admin/settings
 */
router.put('/settings', adminController.updateSettings);

module.exports = router;
