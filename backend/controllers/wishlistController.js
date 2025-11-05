/**
 * Wishlist Controller
 * Pipeline Rivers - Wishlist request handlers
 */

const Wishlist = require('../models/Wishlist');
const { success } = require('../utils/response');

/**
 * Get wishlist
 * GET /api/wishlist
 */
exports.getWishlist = async (req, res, next) => {
  try {
    const items = Wishlist.getBySessionId(req.sessionId);
    return success(res, { items });
  } catch (err) {
    next(err);
  }
};

/**
 * Add item to wishlist
 * POST /api/wishlist/items
 */
exports.addItem = async (req, res, next) => {
  try {
    const added = Wishlist.addItem(req.sessionId, req.body.productId);
    
    if (!added) {
      return success(res, null, 'Product already in wishlist');
    }

    return success(res, null, 'Product added to wishlist');
  } catch (err) {
    next(err);
  }
};

/**
 * Remove item from wishlist
 * DELETE /api/wishlist/items/:productId
 */
exports.removeItem = async (req, res, next) => {
  try {
    const removed = Wishlist.removeItem(req.sessionId, req.params.productId);
    
    if (!removed) {
      return success(res, null, 'Product not in wishlist');
    }

    return success(res, null, 'Product removed from wishlist');
  } catch (err) {
    next(err);
  }
};
