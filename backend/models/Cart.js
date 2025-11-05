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
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          ci.id,
          ci.product_id as productId,
          ci.quantity,
          ci.selected_variants as selectedVariants,
          ci.created_at as addedAt
        FROM cart_items ci
        WHERE ci.session_id = ?
      `;
      db.all(query, [sessionId], (err, items) => {
        if (err) {
          return reject(err);
        }

        Promise.all(items.map(async (item) => {
          const product = await Product.getById(item.productId);
          return {
            ...item,
            product,
            selectedVariants: item.selectedVariants ? JSON.parse(item.selectedVariants) : undefined
          };
        })).then(cartItems => {
          const subtotal = cartItems.reduce((sum, item) => {
            return sum + (item.product.price.amount * item.quantity);
          }, 0);

          resolve({
            id: `cart_${sessionId}`,
            items: cartItems,
            subtotal,
            total: subtotal,
            itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
          });
        }).catch(reject);
      });
    });
  }

  /**
   * Add item to cart
   */
  static addItem(sessionId, data) {
    return new Promise((resolve, reject) => {
      const query = `SELECT id, quantity FROM cart_items WHERE session_id = ? AND product_id = ?`;
      db.get(query, [sessionId, data.productId], (err, existing) => {
        if (err) {
          return reject(err);
        }

        if (existing) {
          const updateQuery = `UPDATE cart_items SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?`;
          db.run(updateQuery, [data.quantity || 1, existing.id], (err) => {
            if (err) {
              return reject(err);
            }
            this.getBySessionId(sessionId).then(resolve).catch(reject);
          });
        } else {
          const id = generateId('item');
          const insertQuery = `INSERT INTO cart_items (id, session_id, product_id, quantity, selected_variants) VALUES (?, ?, ?, ?, ?)`;
          db.run(insertQuery, [id, sessionId, data.productId, data.quantity || 1, data.variants ? JSON.stringify(data.variants) : null], (err) => {
            if (err) {
              return reject(err);
            }
            this.getBySessionId(sessionId).then(resolve).catch(reject);
          });
        }
      });
    });
  }

  /**
   * Update cart item quantity
   */
  static updateItem(sessionId, itemId, quantity) {
    return new Promise((resolve, reject) => {
      if (quantity <= 0) {
        return this.removeItem(sessionId, itemId).then(resolve).catch(reject);
      }
      const query = `UPDATE cart_items SET quantity = ?, updated_at = datetime('now') WHERE id = ? AND session_id = ?`;
      db.run(query, [quantity, itemId, sessionId], (err) => {
        if (err) {
          return reject(err);
        }
        this.getBySessionId(sessionId).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Remove item from cart
   */
  static removeItem(sessionId, itemId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM cart_items WHERE id = ? AND session_id = ?`;
      db.run(query, [itemId, sessionId], (err) => {
        if (err) {
          return reject(err);
        }
        this.getBySessionId(sessionId).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Clear cart
   */
  static clear(sessionId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM cart_items WHERE session_id = ?`;
      db.run(query, [sessionId], (err) => {
        if (err) {
          return reject(err);
        }
        this.getBySessionId(sessionId).then(resolve).catch(reject);
      });
    });
  }
}

module.exports = Cart;
