/**
 * Review Model
 * Pipeline Rivers - Review data access layer
 */

const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

class Review {
  /**
   * Get reviews for a product
   */
  static getByProductId(productId, page = 1, limit = 10, sort = 'date', order = 'DESC') {
    const offset = (page - 1) * limit;

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM reviews WHERE product_id = ?'
    ).get(productId).count;

    // Determine sort field
    let sortField;
    switch (sort) {
      case 'rating':
        sortField = 'rating';
        break;
      case 'helpful':
        sortField = 'helpful_count';
        break;
      case 'date':
      default:
        sortField = 'created_at';
        break;
    }

    const reviews = db.prepare(`
      SELECT
        id,
        product_id as productId,
        author_name,
        author_verified,
        rating,
        title,
        content,
        helpful_count as helpful,
        created_at as createdAt
      FROM reviews
      WHERE product_id = ?
      ORDER BY ${sortField} ${order}
      LIMIT ? OFFSET ?
    `).all(productId, limit, offset);

    return {
      reviews: reviews.map(r => ({
        ...r,
        author: {
          name: r.author_name,
          verified: Boolean(r.author_verified)
        },
        author_name: undefined,
        author_verified: undefined
      })),
      total
    };
  }

  /**
   * Create review
   */
  static create(data) {
    const id = generateId('rev');

    const stmt = db.prepare(`
      INSERT INTO reviews (
        id, product_id, author_name, author_verified,
        rating, title, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.productId,
      data.authorName || data.author?.name,
      0, // Default to not verified
      data.rating,
      data.title || null,
      data.content
    );

    // Update product rating
    this.updateProductRating(data.productId);

    return id;
  }

  /**
   * Update product rating average
   */
  static updateProductRating(productId) {
    const stats = db.prepare(`
      SELECT 
        AVG(rating) as average,
        COUNT(*) as count
      FROM reviews
      WHERE product_id = ?
    `).get(productId);

    db.prepare(`
      UPDATE products
      SET rating_average = ?, rating_count = ?
      WHERE id = ?
    `).run(stats.average || 0, stats.count || 0, productId);
  }
}

module.exports = Review;
