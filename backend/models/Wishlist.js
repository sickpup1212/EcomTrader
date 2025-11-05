/**
 * Wishlist Model
 * Pipeline Rivers - Wishlist data access layer
 */

const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

class Wishlist {
  /**
   * Get wishlist for session
   */
  static getBySessionId(sessionId) {
    const items = db.prepare(`
      SELECT 
        wi.id,
        wi.product_id as productId,
        wi.created_at as addedAt
      FROM wishlist_items wi
      WHERE wi.session_id = ?
      ORDER BY wi.created_at DESC
    `).all(sessionId);

    return items;
  }

  /**
   * Add item to wishlist
   */
  static addItem(sessionId, productId) {
    try {
      const id = generateId('wish');
      db.prepare(`
        INSERT INTO wishlist_items (id, session_id, product_id)
        VALUES (?, ?, ?)
      `).run(id, sessionId, productId);
      return true;
    } catch (error) {
      // Item already in wishlist (UNIQUE constraint)
      if (error.code === 'SQLITE_CONSTRAINT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove item from wishlist
   */
  static removeItem(sessionId, productId) {
    const result = db.prepare(`
      DELETE FROM wishlist_items
      WHERE session_id = ? AND product_id = ?
    `).run(sessionId, productId);

    return result.changes > 0;
  }

  /**
   * Check if item is in wishlist
   */
  static hasItem(sessionId, productId) {
    const item = db.prepare(`
      SELECT id FROM wishlist_items
      WHERE session_id = ? AND product_id = ?
    `).get(sessionId, productId);

    return !!item;
  }
}

module.exports = Wishlist;
