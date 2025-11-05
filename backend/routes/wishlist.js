/**
 * Wishlist Routes
 * Pipeline Rivers - Wishlist endpoints
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const wishlistController = require('../controllers/wishlistController');
const sessionHandler = require('../middleware/sessionHandler');
const validateRequest = require('../middleware/validateRequest');

// Apply session handler to all wishlist routes
router.use(sessionHandler);

/**
 * Get wishlist
 * GET /api/wishlist
 */
router.get('/', wishlistController.getWishlist);

/**
 * Add item to wishlist
 * POST /api/wishlist/items
 */
router.post(
  '/items',
  [
    body('productId').notEmpty().withMessage('Product ID is required')
  ],
  validateRequest,
  wishlistController.addItem
);

/**
 * Remove item from wishlist
 * DELETE /api/wishlist/items/:productId
 */
router.delete('/items/:productId', wishlistController.removeItem);

module.exports = router;
