/**
 * Admin Inventory Routes
 * Pipeline Rivers - Administrative inventory management endpoints
 */

const express = require('express');
const router = express.Router();
const adminInventoryController = require('../controllers/adminInventoryController');
const { inventoryValidation, commonValidation } = require('../validation/adminValidation');

/**
 * Inventory Overview and Statistics
 */

// GET /api/admin/inventory/stats - Get inventory summary statistics
router.get('/stats', adminInventoryController.getInventoryStats);

// GET /api/admin/inventory/value-by-category - Get inventory value by category
router.get('/value-by-category', adminInventoryController.getInventoryValueByCategory);

// GET /api/admin/inventory/low-stock - Get low stock products
router.get('/low-stock', adminInventoryController.getLowStockProducts);

// GET /api/admin/inventory/reorder - Get products that need reordering
router.get('/reorder', adminInventoryController.getReorderProducts);

// GET /api/admin/inventory/alerts - Get active inventory alerts
router.get('/alerts', adminInventoryController.getInventoryAlerts);

// GET /api/admin/inventory/export - Export inventory data
router.get('/export', adminInventoryController.exportInventoryData);

/**
 * Inventory Adjustments
 */

// GET /api/admin/inventory/adjustments - Get inventory adjustments
router.get('/adjustments', commonValidation.pagination, commonValidation.dateRange, adminInventoryController.getInventoryAdjustments);

// POST /api/admin/inventory/adjustments - Create inventory adjustment
router.post('/adjustments', inventoryValidation.createAdjustment, adminInventoryController.createInventoryAdjustment);

// POST /api/admin/inventory/adjustments/bulk - Bulk inventory adjustments
router.post('/adjustments/bulk', inventoryValidation.bulkAdjustments, adminInventoryController.bulkInventoryAdjustments);

/**
 * Inventory Movement and Reporting
 */

// GET /api/admin/inventory/movement - Get inventory movement report
router.get('/movement', [
  commonValidation.dateRange,
  require('express-validator').query('productId')
    .optional()
    .isUUID()
    .withMessage('Invalid product ID format'),
  require('express-validator').query('type')
    .optional()
    .isIn(['purchase', 'sale', 'return', 'damage', 'theft', 'adjustment', 'transfer'])
    .withMessage('Invalid adjustment type'),
  require('express-validator').query('groupBy')
    .optional()
    .isIn(['date', 'type', 'product'])
    .withMessage('Group by must be one of: date, type, product'),
  require('../validation/adminValidation').handleValidationErrors
], adminInventoryController.getInventoryMovement);

/**
 * Individual Product Inventory
 */

// GET /api/admin/inventory/products/:productId - Get product inventory details
router.get('/products/:productId', commonValidation.uuid('productId'), adminInventoryController.getProductInventory);

/**
 * Inventory Management
 */

// POST /api/admin/inventory/sync - Sync inventory (recalculate from adjustments)
router.post('/sync', adminInventoryController.syncInventory);

/**
 * Alert Management
 */

// PUT /api/admin/inventory/alerts/:alertId/resolve - Resolve inventory alert
router.put('/alerts/:alertId/resolve', commonValidation.uuid('alertId'), [
  require('express-validator').body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  require('../validation/adminValidation').handleValidationErrors
], adminInventoryController.resolveInventoryAlert);

module.exports = router;