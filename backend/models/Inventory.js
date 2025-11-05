/**
 * Inventory Model
 * Pipeline Rivers - Inventory tracking and management
 *
 * Handles all inventory operations including adjustments,
 * low stock alerts, and inventory reporting
 */

const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

class Inventory {
  /**
   * Get inventory status for a product
   */
  static getProductInventory(productId) {
    const product = db.prepare(`
      SELECT
        id,
        name,
        sku,
        stock_quantity,
        stock_low_threshold,
        reorder_level,
        stock_status,
        status
      FROM products
      WHERE id = ?
    `).get(productId);

    if (!product) return null;

    // Get recent adjustments
    const adjustments = db.prepare(`
      SELECT
        id,
        adjustment_type,
        quantity,
        reason,
        notes,
        created_by,
        created_at
      FROM inventory_adjustments
      WHERE product_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(productId);

    // Get active alerts
    const alerts = db.prepare(`
      SELECT
        id,
        alert_type,
        current_quantity,
        threshold,
        created_at
      FROM low_stock_alerts
      WHERE product_id = ? AND is_resolved = 0
      ORDER BY created_at DESC
    `).all(productId);

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      stock: {
        quantity: product.stock_quantity,
        status: product.stock_status,
        lowStockThreshold: product.stock_low_threshold,
        reorderLevel: product.reorder_level,
        needsReorder: product.stock_quantity <= product.reorder_level
      },
      recentAdjustments: adjustments,
      activeAlerts: alerts
    };
  }

  /**
   * Create inventory adjustment
   */
  static createAdjustment(data) {
    const { productId, type, quantity, reason, notes, createdBy } = data;

    // Validate adjustment type
    const validTypes = ['purchase', 'sale', 'return', 'damage', 'theft', 'adjustment', 'transfer'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid adjustment type: ${type}`);
    }

    // Start transaction
    const transaction = db.transaction(() => {
      // Get current product info
      const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate new quantity
      let newQuantity = product.stock_quantity;
      switch (type) {
        case 'purchase':
        case 'return':
          newQuantity += quantity;
          break;
        case 'sale':
        case 'damage':
        case 'theft':
          newQuantity -= quantity;
          if (newQuantity < 0) {
            throw new Error('Insufficient stock for this adjustment');
          }
          break;
        case 'adjustment':
          newQuantity = quantity;
          break;
        case 'transfer':
          // For transfers, quantity can be positive or negative
          newQuantity += quantity;
          if (newQuantity < 0) {
            throw new Error('Insufficient stock for transfer');
          }
          break;
      }

      // Update product stock
      const stockStatus = this.calculateStockStatus(newQuantity);
      db.prepare(`
        UPDATE products
        SET stock_quantity = ?, stock_status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newQuantity, stockStatus, productId);

      // Log adjustment
      const adjustmentId = generateId('adj');
      db.prepare(`
        INSERT INTO inventory_adjustments (
          id, product_id, adjustment_type, quantity, reason, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(adjustmentId, productId, type, quantity, reason, notes, createdBy);

      // Check for low stock alerts
      this.checkLowStockAlert(productId, newQuantity);

      return adjustmentId;
    });

    return transaction();
  }

  /**
   * Bulk inventory adjustment
   */
  static bulkAdjustments(adjustments) {
    const results = [];

    const transaction = db.transaction(() => {
      for (const adjustment of adjustments) {
        try {
          const adjustmentId = this.createAdjustment(adjustment);
          results.push({
            productId: adjustment.productId,
            success: true,
            adjustmentId
          });
        } catch (error) {
          results.push({
            productId: adjustment.productId,
            success: false,
            error: error.message
          });
        }
      }
    });

    transaction();
    return results;
  }

  /**
   * Get inventory adjustments with pagination and filtering
   */
  static getAdjustments(filters = {}) {
    const {
      page = 1,
      limit = 25,
      productId,
      type,
      startDate,
      endDate
    } = filters;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (productId) {
      whereClause += ' AND ia.product_id = ?';
      params.push(productId);
    }

    if (type) {
      whereClause += ' AND ia.adjustment_type = ?';
      params.push(type);
    }

    if (startDate) {
      whereClause += ' AND ia.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND ia.created_at <= ?';
      params.push(endDate);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_adjustments ia
      ${whereClause}
    `;
    const { total } = db.prepare(countQuery).get(...params);

    // Get adjustments with product info
    const query = `
      SELECT
        ia.*,
        p.name as product_name,
        p.sku as product_sku
      FROM inventory_adjustments ia
      LEFT JOIN products p ON ia.product_id = p.id
      ${whereClause}
      ORDER BY ia.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const adjustments = db.prepare(query).all(...params, limit, offset);

    return {
      adjustments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get low stock products
   */
  static getLowStockProducts() {
    return db.prepare(`
      SELECT
        id,
        name,
        sku,
        stock_quantity,
        stock_low_threshold,
        stock_status,
        reorder_level
      FROM products
      WHERE stock_quantity <= stock_low_threshold AND status = 'active'
      ORDER BY stock_quantity ASC
    `).all();
  }

  /**
   * Get products that need reordering
   */
  static getReorderProducts() {
    return db.prepare(`
      SELECT
        id,
        name,
        sku,
        stock_quantity,
        reorder_level,
        stock_status
      FROM products
      WHERE stock_quantity <= reorder_level AND status = 'active'
      ORDER BY stock_quantity ASC
    `).all();
  }

  /**
   * Get inventory summary statistics
   */
  static getInventoryStats() {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_stock,
        SUM(CASE WHEN stock_status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as reorder_count,
        SUM(price_amount * stock_quantity) as total_value
      FROM products
      WHERE status = 'active'
    `).get();

    // Get recent activity
    const recentActivity = db.prepare(`
      SELECT
        adjustment_type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM inventory_adjustments
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY adjustment_type
    `).all();

    return {
      totalProducts: stats.total_products,
      totalStock: stats.total_stock || 0,
      lowStockProducts: stats.low_stock_count,
      outOfStockProducts: stats.out_of_stock_count,
      reorderProducts: stats.reorder_count,
      totalInventoryValue: stats.total_value || 0,
      recentActivity: recentActivity.reduce((acc, activity) => {
        acc[activity.adjustment_type] = {
          count: activity.count,
          totalQuantity: activity.total_quantity
        };
        return acc;
      }, {})
    };
  }

  /**
   * Check and create low stock alerts
   */
  static checkLowStockAlert(productId, quantity) {
    const product = db.prepare(`
      SELECT stock_low_threshold, reorder_level
      FROM products
      WHERE id = ?
    `).get(productId);

    if (!product) return;

    const alerts = [];

    // Check low stock alert
    if (quantity <= product.stock_low_threshold) {
      const existingAlert = db.prepare(`
        SELECT id FROM low_stock_alerts
        WHERE product_id = ? AND alert_type = 'low_stock' AND is_resolved = 0
      `).get(productId);

      if (!existingAlert) {
        const alertId = generateId('alert');
        db.prepare(`
          INSERT INTO low_stock_alerts (
            id, product_id, alert_type, current_quantity, threshold
          ) VALUES (?, ?, 'low_stock', ?, ?)
        `).run(alertId, productId, quantity, product.stock_low_threshold);
        alerts.push({ type: 'low_stock', id: alertId });
      }
    }

    // Check reorder alert
    if (quantity <= product.reorder_level) {
      const existingAlert = db.prepare(`
        SELECT id FROM low_stock_alerts
        WHERE product_id = ? AND alert_type = 'reorder' AND is_resolved = 0
      `).get(productId);

      if (!existingAlert) {
        const alertId = generateId('alert');
        db.prepare(`
          INSERT INTO low_stock_alerts (
            id, product_id, alert_type, current_quantity, threshold
          ) VALUES (?, ?, 'reorder', ?, ?)
        `).run(alertId, productId, quantity, product.reorder_level);
        alerts.push({ type: 'reorder', id: alertId });
      }
    }

    return alerts;
  }

  /**
   * Resolve low stock alert
   */
  static resolveAlert(alertId) {
    const result = db.prepare(`
      UPDATE low_stock_alerts
      SET is_resolved = 1, resolved_at = datetime('now')
      WHERE id = ?
    `).run(alertId);

    return result.changes > 0;
  }

  /**
   * Get all active alerts
   */
  static getActiveAlerts() {
    return db.prepare(`
      SELECT
        la.*,
        p.name as product_name,
        p.sku as product_sku
      FROM low_stock_alerts la
      LEFT JOIN products p ON la.product_id = p.id
      WHERE la.is_resolved = 0
      ORDER BY la.created_at DESC
    `).all();
  }

  /**
   * Calculate stock status
   */
  static calculateStockStatus(quantity, lowThreshold = 20) {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= lowThreshold) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Get inventory value by category
   */
  static getInventoryValueByCategory() {
    return db.prepare(`
      SELECT
        c.name as category_name,
        COUNT(p.id) as product_count,
        SUM(p.stock_quantity) as total_quantity,
        SUM(p.price_amount * p.stock_quantity) as total_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY total_value DESC
    `).all();
  }
}

module.exports = Inventory;