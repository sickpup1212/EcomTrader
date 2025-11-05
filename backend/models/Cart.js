/**
 * Cart Model
 * Pipeline Rivers - Shopping cart data access layer
 */

const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');
const Product = require('./Product');

class Cart {
  /**
   * Get cart for session
   */
  static getBySessionId(sessionId) {
    const items = db.prepare(`
      SELECT 
        ci.id,
        ci.product_id as productId,
        ci.quantity,
        ci.selected_variants as selectedVariants,
        ci.created_at as addedAt
      FROM cart_items ci
      WHERE ci.session_id = ?
    `).all(sessionId);

    // Get full product data for each item
    const cartItems = items.map(item => {
      const product = Product.getById(item.productId);
      return {
        ...item,
        product,
        selectedVariants: item.selectedVariants ? JSON.parse(item.selectedVariants) : undefined
      };
    });

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.product.price.amount * item.quantity);
    }, 0);

    return {
      id: `cart_${sessionId}`,
      items: cartItems,
      subtotal,
      total: subtotal,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  /**
   * Add item to cart
   */
  static addItem(sessionId, data) {
    // Check if item already exists
    const existing = db.prepare(`
      SELECT id, quantity FROM cart_items
      WHERE session_id = ? AND product_id = ?
    `).get(sessionId, data.productId);

    if (existing) {
      // Update quantity
      db.prepare(`
        UPDATE cart_items
        SET quantity = quantity + ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(data.quantity || 1, existing.id);
    } else {
      // Insert new item
      const id = generateId('item');
      db.prepare(`
        INSERT INTO cart_items (id, session_id, product_id, quantity, selected_variants)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        id,
        sessionId,
        data.productId,
        data.quantity || 1,
        data.variants ? JSON.stringify(data.variants) : null
      );
    }

    return this.getBySessionId(sessionId);
  }

  /**
   * Update cart item quantity
   */
  static updateItem(sessionId, itemId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(sessionId, itemId);
    }

    db.prepare(`
      UPDATE cart_items
      SET quantity = ?, updated_at = datetime('now')
      WHERE id = ? AND session_id = ?
    `).run(quantity, itemId, sessionId);

    return this.getBySessionId(sessionId);
  }

  /**
   * Remove item from cart
   */
  static removeItem(sessionId, itemId) {
    db.prepare(`
      DELETE FROM cart_items
      WHERE id = ? AND session_id = ?
    `).run(itemId, sessionId);

    return this.getBySessionId(sessionId);
  }

  /**
   * Clear cart
   */
  static clear(sessionId) {
    db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
    return this.getBySessionId(sessionId);
  }
}

module.exports = Cart;
