/**
 * Cart Controller
 * Pipeline Rivers - Shopping cart request handlers
 */

const Cart = require('../models/Cart');
const { success } = require('../utils/response');

/**
 * Get cart
 * GET /api/cart
 */
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.getBySessionId(req.sessionId);
    return success(res, { cart });
  } catch (err) {
    next(err);
  }
};

/**
 * Add item to cart
 * POST /api/cart/items
 */
exports.addItem = async (req, res, next) => {
  try {
    const cart = await Cart.addItem(req.sessionId, req.body);
    return success(res, { cart }, 'Product added to cart');
  } catch (err) {
    next(err);
  }
};

/**
 * Update cart item
 * PUT /api/cart/items/:id
 */
exports.updateItem = async (req, res, next) => {
  try {
    const cart = await Cart.updateItem(req.sessionId, req.params.id, req.body.quantity);
    return success(res, { cart }, 'Cart updated');
  } catch (err) {
    next(err);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/items/:id
 */
exports.removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.removeItem(req.sessionId, req.params.id);
    return success(res, { cart }, 'Item removed from cart');
  } catch (err) {
    next(err);
  }
};

/**
 * Clear cart
 * DELETE /api/cart
 */
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.clear(req.sessionId);
    return success(res, { cart }, 'Cart cleared');
  } catch (err) {
    next(err);
  }
};
