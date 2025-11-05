/**
 * Admin Product Routes
 * Pipeline Rivers - Administrative product management endpoints
 */

const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');
const { productValidation, commonValidation } = require('../validation/adminValidation');

/**
 * Product CRUD Operations
 */

// GET /api/admin/products - Get all products with filtering
router.get('/', productValidation.search, adminProductController.getProducts);

// GET /api/admin/products/search - Advanced product search
router.get('/search', productValidation.search, adminProductController.searchProducts);

// GET /api/admin/products/stats - Get product statistics
router.get('/stats', adminProductController.getProductStats);

// GET /api/admin/products/low-stock - Get low stock products
router.get('/low-stock', adminProductController.getLowStockProducts);

// GET /api/admin/products/reorder - Get products that need reordering
router.get('/reorder', adminProductController.getReorderProducts);

// GET /api/admin/products/export - Export products data
router.get('/export', adminProductController.exportProducts);

// GET /api/admin/products/status/:status - Get products by status
router.get('/status/:status', adminProductController.getProductsByStatus);

// POST /api/admin/products - Create new product
router.post('/', productValidation.create, adminProductController.createProduct);

// POST /api/admin/products/bulk - Bulk update products
router.put('/bulk', productValidation.bulkUpdate, adminProductController.bulkUpdateProducts);

// DELETE /api/admin/products/bulk - Bulk delete products
router.delete('/bulk', productValidation.bulkDelete, adminProductController.bulkDeleteProducts);

/**
 * Individual Product Operations
 */

// GET /api/admin/products/:id - Get single product
router.get('/:id', commonValidation.uuid('id'), adminProductController.getProduct);

// PUT /api/admin/products/:id - Update product
router.put('/:id', productValidation.update, adminProductController.updateProduct);

// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', commonValidation.uuid('id'), adminProductController.deleteProduct);

// POST /api/admin/products/:id/duplicate - Duplicate product
router.post('/:id/duplicate', commonValidation.uuid('id'), adminProductController.duplicateProduct);

/**
 * Product Inventory Operations
 */

// GET /api/admin/products/:id/inventory - Get product inventory info
router.get('/:id/inventory', commonValidation.uuid('id'), adminProductController.getProductInventory);

// PUT /api/admin/products/:id/inventory - Update product inventory
router.put('/:id/inventory', [
  commonValidation.uuid('id'),
  require('express-validator').body('type')
    .isIn(['purchase', 'sale', 'return', 'damage', 'theft', 'adjustment', 'transfer'])
    .withMessage('Invalid adjustment type'),
  require('express-validator').body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  require('express-validator').body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
  require('../validation/adminValidation').handleValidationErrors
], adminProductController.updateProductInventory);

module.exports = router;