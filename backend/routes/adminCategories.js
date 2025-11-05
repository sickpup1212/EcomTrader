/**
 * Admin Category Routes
 * Pipeline Rivers - Administrative category management endpoints
 */

const express = require('express');
const router = express.Router();
const adminCategoryController = require('../controllers/adminCategoryController');
const { categoryValidation, commonValidation } = require('../validation/adminValidation');

/**
 * Category CRUD Operations
 */

// GET /api/admin/categories - Get all categories (flat list)
router.get('/', adminCategoryController.getCategories);

// GET /api/admin/categories/tree - Get category tree (hierarchical)
router.get('/tree', adminCategoryController.getCategoryTree);

// GET /api/admin/categories/options - Get category options for dropdowns
router.get('/options', adminCategoryController.getCategoryOptions);

// GET /api/admin/categories/export - Export categories data
router.get('/export', adminCategoryController.exportCategories);

// POST /api/admin/categories - Create new category
router.post('/', categoryValidation.create, adminCategoryController.createCategory);

// PUT /api/admin/categories/reorder - Reorder categories
router.put('/reorder', categoryValidation.reorder, adminCategoryController.reorderCategories);

// PUT /api/admin/categories/bulk - Bulk update categories
router.put('/bulk', adminCategoryController.bulkUpdateCategories);

/**
 * Individual Category Operations
 */

// GET /api/admin/categories/:id - Get single category
router.get('/:id', commonValidation.uuid('id'), adminCategoryController.getCategory);

// PUT /api/admin/categories/:id - Update category
router.put('/:id', categoryValidation.update, adminCategoryController.updateCategory);

// DELETE /api/admin/categories/:id - Delete category
router.delete('/:id', commonValidation.uuid('id'), adminCategoryController.deleteCategory);

// GET /api/admin/categories/:id/breadcrumbs - Get category breadcrumbs
router.get('/:id/breadcrumbs', commonValidation.uuid('id'), adminCategoryController.getCategoryBreadcrumbs);

// GET /api/admin/categories/:id/products - Get products in category
router.get('/:id/products', commonValidation.uuid('id'), adminCategoryController.getCategoryProducts);

// GET /api/admin/categories/:id/stats - Get category statistics
router.get('/:id/stats', commonValidation.uuid('id'), adminCategoryController.getCategoryStats);

// POST /api/admin/categories/:id/move-products - Move products to another category
router.post('/:id/move-products', categoryValidation.moveProducts, adminCategoryController.moveProducts);

module.exports = router;