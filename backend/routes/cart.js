/**
 * Cart Routes
 * Pipeline Rivers - Shopping cart endpoints
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const sessionHandler = require('../middleware/sessionHandler');
const validateRequest = require('../middleware/validateRequest');

// Apply session handler to all cart routes
router.use(sessionHandler);

/**
 * Get cart
 * GET /api/cart
 */
router.get('/', cartController.getCart);

/**
 * Add item to cart
 * POST /api/cart/items
 */
router.post(
  '/items',
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  validateRequest,
  cartController.addItem
);

/**
 * Update cart item
 * PUT /api/cart/items/:id
 */
router.put(
  '/items/:id',
  [
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number')
  ],
  validateRequest,
  cartController.updateItem
);

/**
 * Remove item from cart
 * DELETE /api/cart/items/:id
 */
router.delete('/items/:id', cartController.removeItem);

/**
 * Clear cart
 * DELETE /api/cart
 */
router.delete('/', cartController.clearCart);

module.exports = router;
