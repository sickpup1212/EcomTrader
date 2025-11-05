/**
 * Administrative Input Validation Schemas
 * Pipeline Rivers - Comprehensive input validation for admin operations
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: errorMessages
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
  next();
};

/**
 * Product validation schemas
 */
const productValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Product name must be between 1 and 255 characters'),
    body('sku')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('SKU must be between 1 and 100 characters')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage('SKU can only contain letters, numbers, hyphens, and underscores'),
    body('description')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    body('shortDescription')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Short description must not exceed 500 characters'),
    body('categoryId')
      .isUUID()
      .withMessage('Invalid category ID format'),
    body('price.amount')
      .isFloat({ min: 0 })
      .withMessage('Price amount must be a positive number'),
    body('price.currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code'),
    body('price.originalAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Original price must be a positive number'),
    body('price.discount.percentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Discount percentage must be between 0 and 100'),
    body('price.discount.amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount amount must be a positive number'),
    body('stock.quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    body('stock.lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('stock.reorderLevel')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reorder level must be a non-negative integer'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('length')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Length must be a positive number'),
    body('width')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Width must be a positive number'),
    body('height')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Height must be a positive number'),
    body('dimensions.unit')
      .optional()
      .isIn(['cm', 'in', 'mm'])
      .withMessage('Dimensions unit must be one of: cm, in, mm'),
    body('colors')
      .optional()
      .isArray()
      .withMessage('Colors must be an array'),
    body('colors.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each color must be between 1 and 50 characters'),
    body('sizes')
      .optional()
      .isArray()
      .withMessage('Sizes must be an array'),
    body('sizes.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each size must be between 1 and 50 characters'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'discontinued'])
      .withMessage('Status must be one of: active, inactive, discontinued'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    body('images.*.url')
      .optional()
      .isURL()
      .withMessage('Each image URL must be valid'),
    body('images.*.alt')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Each image alt text must be between 1 and 255 characters'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid product ID format'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Product name must be between 1 and 255 characters'),
    body('sku')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('SKU must be between 1 and 100 characters')
      .matches(/^[A-Za-z0-9-_]+$/)
      .withMessage('SKU can only contain letters, numbers, hyphens, and underscores'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    // Include other optional fields with validation
    body('price.amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price amount must be a positive number'),
    body('stock.quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    handleValidationErrors
  ],

  bulkUpdate: [
    body('updates')
      .isArray({ min: 1 })
      .withMessage('Updates must be a non-empty array'),
    body('updates.*.id')
      .isUUID()
      .withMessage('Each product ID must be a valid UUID'),
    body('updates.*.data')
      .isObject()
      .withMessage('Each update must contain a data object'),
    handleValidationErrors
  ],

  bulkDelete: [
    body('productIds')
      .isArray({ min: 1 })
      .withMessage('Product IDs must be a non-empty array'),
    body('productIds.*')
      .isUUID()
      .withMessage('Each product ID must be a valid UUID'),
    handleValidationErrors
  ],

  search: [
    query('q')
      .trim()
      .isLength({ min: 1 })
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
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'discontinued'])
      .withMessage('Status must be one of: active, inactive, discontinued'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ]
};

/**
 * Category validation schemas
 */
const categoryValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Category name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('parentId')
      .optional()
      .isUUID()
      .withMessage('Invalid parent category ID format'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be valid'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid category ID format'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Category name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('parentId')
      .optional()
      .isUUID()
      .withMessage('Invalid parent category ID format'),
    handleValidationErrors
  ],

  reorder: [
    body('categories')
      .isArray({ min: 1 })
      .withMessage('Categories must be a non-empty array'),
    body('categories.*.categoryId')
      .isUUID()
      .withMessage('Each category ID must be a valid UUID'),
    body('categories.*.displayOrder')
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer'),
    handleValidationErrors
  ],

  moveProducts: [
    param('id')
      .isUUID()
      .withMessage('Invalid category ID format'),
    body('productIds')
      .isArray({ min: 1 })
      .withMessage('Product IDs must be a non-empty array'),
    body('productIds.*')
      .isUUID()
      .withMessage('Each product ID must be a valid UUID'),
    body('targetCategoryId')
      .isUUID()
      .withMessage('Target category ID must be a valid UUID'),
    handleValidationErrors
  ]
};

/**
 * Inventory validation schemas
 */
const inventoryValidation = {
  createAdjustment: [
    body('productId')
      .isUUID()
      .withMessage('Invalid product ID format'),
    body('type')
      .isIn(['purchase', 'sale', 'return', 'damage', 'theft', 'adjustment', 'transfer'])
      .withMessage('Invalid adjustment type'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('reason')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Reason must be between 1 and 500 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
    handleValidationErrors
  ],

  bulkAdjustments: [
    body('adjustments')
      .isArray({ min: 1 })
      .withMessage('Adjustments must be a non-empty array'),
    body('adjustments.*.productId')
      .isUUID()
      .withMessage('Each product ID must be a valid UUID'),
    body('adjustments.*.type')
      .isIn(['purchase', 'sale', 'return', 'damage', 'theft', 'adjustment', 'transfer'])
      .withMessage('Invalid adjustment type'),
    body('adjustments.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('adjustments.*.reason')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Reason must be between 1 and 500 characters'),
    handleValidationErrors
  ]
};

/**
 * Common validation schemas
 */
const commonValidation = {
  uuid: (field = 'id') => [
    param(field)
      .isUUID()
      .withMessage(`Invalid ${field} format`),
    handleValidationErrors
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    handleValidationErrors
  ]
};

module.exports = {
  productValidation,
  categoryValidation,
  inventoryValidation,
  commonValidation,
  handleValidationErrors
};