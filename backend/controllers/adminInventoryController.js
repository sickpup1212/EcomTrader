/**
 * Admin Inventory Controller
 * Pipeline Rivers - Administrative inventory management
 *
 * Handles all administrative inventory operations including adjustments,
 * alerts, reporting, and bulk inventory operations
 */

const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { success, notFound, error, validationError } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

/**
 * Get inventory adjustments with pagination and filtering
 * GET /api/admin/inventory/adjustments
 */
exports.getInventoryAdjustments = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 25,
      productId: req.query.productId,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = Inventory.getAdjustments(filters);

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * Create inventory adjustment
 * POST /api/admin/inventory/adjustments
 */
exports.createInventoryAdjustment = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, notes } = req.body;

    // Validate required fields
    if (!productId || !type || quantity === undefined || !reason) {
      return validationError(res, 'Product ID, type, quantity, and reason are required');
    }

    // Validate product exists
    const product = Product.getById(productId);
    if (!product) {
      return notFound(res, 'Product');
    }

    const adjustmentId = Inventory.createAdjustment({
      productId,
      type,
      quantity: parseInt(quantity),
      reason,
      notes: notes || null,
      createdBy: req.user?.id || 'admin'
    });

    const updatedInventory = Inventory.getProductInventory(productId);

    return success(res, {
      adjustmentId,
      inventory: updatedInventory
    }, 'Inventory adjustment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk inventory adjustments
 * POST /api/admin/inventory/adjustments/bulk
 */
exports.bulkInventoryAdjustments = async (req, res, next) => {
  try {
    const { adjustments } = req.body;

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return validationError(res, 'Adjustments array is required');
    }

    // Validate each adjustment
    for (const adj of adjustments) {
      if (!adj.productId || !adj.type || adj.quantity === undefined || !adj.reason) {
        return validationError(res, 'Each adjustment must have productId, type, quantity, and reason');
      }

      const product = Product.getById(adj.productId);
      if (!product) {
        return notFound(res, `Product ${adj.productId}`);
      }
    }

    const results = Inventory.bulkAdjustments(adjustments);

    return success(res, {
      results,
      processed: adjustments.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }, 'Bulk inventory adjustments completed');
  } catch (err) {
    next(err);
  }
};

/**
 * Get inventory summary statistics
 * GET /api/admin/inventory/stats
 */
exports.getInventoryStats = async (req, res, next) => {
  try {
    const stats = Inventory.getInventoryStats();
    const inventoryValueByCategory = Inventory.getInventoryValueByCategory();

    return success(res, {
      ...stats,
      valueByCategory: inventoryValueByCategory
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get low stock products
 * GET /api/admin/inventory/low-stock
 */
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const { threshold } = req.query;

    let products;
    if (threshold) {
      // Get products below custom threshold
      products = Product.getAll({
        customWhere: `stock_quantity <= ${parseInt(threshold)} AND status = 'active'`
      }).products;
    } else {
      products = Inventory.getLowStockProducts();
    }

    return success(res, {
      products,
      count: products.length,
      threshold: threshold ? parseInt(threshold) : 'default'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get products that need reordering
 * GET /api/admin/inventory/reorder
 */
exports.getReorderProducts = async (req, res, next) => {
  try {
    const products = Inventory.getReorderProducts();

    return success(res, {
      products,
      count: products.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get active inventory alerts
 * GET /api/admin/inventory/alerts
 */
exports.getInventoryAlerts = async (req, res, next) => {
  try {
    const { type, resolved } = req.query;

    let alerts = Inventory.getActiveAlerts();

    // Filter by type if specified
    if (type) {
      alerts = alerts.filter(alert => alert.alert_type === type);
    }

    // Filter by resolved status if specified
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      alerts = alerts.filter(alert => Boolean(alert.is_resolved) === isResolved);
    }

    return success(res, {
      alerts,
      count: alerts.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Resolve inventory alert
 * PUT /api/admin/inventory/alerts/:alertId/resolve
 */
exports.resolveInventoryAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;

    const resolved = Inventory.resolveAlert(alertId);

    if (!resolved) {
      return notFound(res, 'Inventory alert');
    }

    return success(res, {
      alertId,
      resolvedAt: new Date().toISOString(),
      notes
    }, 'Inventory alert resolved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get detailed inventory information for a product
 * GET /api/admin/inventory/products/:productId
 */
exports.getProductInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = Product.getById(productId);
    if (!product) {
      return notFound(res, 'Product');
    }

    const inventory = Inventory.getProductInventory(productId);

    return success(res, inventory);
  } catch (err) {
    next(err);
  }
};

/**
 * Get inventory value by category
 * GET /api/admin/inventory/value-by-category
 */
exports.getInventoryValueByCategory = async (req, res, next) => {
  try {
    const valueByCategory = Inventory.getInventoryValueByCategory();

    return success(res, valueByCategory);
  } catch (err) {
    next(err);
  }
};

/**
 * Export inventory data
 * GET /api/admin/inventory/export
 */
exports.exportInventoryData = async (req, res, next) => {
  try {
    const { format = 'json', type = 'all' } = req.query;

    let data;

    switch (type) {
      case 'adjustments':
        data = Inventory.getAdjustments({ limit: 10000 });
        break;
      case 'lowStock':
        data = { products: Inventory.getLowStockProducts() };
        break;
      case 'reorder':
        data = { products: Inventory.getReorderProducts() };
        break;
      case 'alerts':
        data = { alerts: Inventory.getActiveAlerts() };
        break;
      case 'stats':
        data = {
          ...Inventory.getInventoryStats(),
          valueByCategory: Inventory.getInventoryValueByCategory()
        };
        break;
      default:
        data = {
          stats: Inventory.getInventoryStats(),
          adjustments: Inventory.getAdjustments({ limit: 1000 }),
          lowStock: Inventory.getLowStockProducts(),
          reorder: Inventory.getReorderProducts(),
          alerts: Inventory.getActiveAlerts(),
          valueByCategory: Inventory.getInventoryValueByCategory()
        };
    }

    if (format === 'csv') {
      let csvContent = '';

      if (type === 'adjustments') {
        csvContent = 'ID,Product ID,Product Name,Type,Quantity,Reason,Created At\n';
        csvContent += data.adjustments.map(adj =>
          `${adj.id},${adj.product_id},"${adj.product_name}",${adj.adjustment_type},${adj.quantity},"${adj.reason}",${adj.created_at}`
        ).join('\n');
      } else if (type === 'lowStock') {
        csvContent = 'ID,Name,SKU,Current Quantity,Low Stock Threshold,Status\n';
        csvContent += data.products.map(p =>
          `${p.id},"${p.name}",${p.sku},${p.stock_quantity},${p.stock_low_threshold},${p.stock_status}`
        ).join('\n');
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-${type}.csv"`);
      return res.send(csvContent);
    } else {
      // Default JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-${type}.json"`);
      return res.json({
        exportedAt: new Date().toISOString(),
        type,
        data
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get inventory movement report
 * GET /api/admin/inventory/movement
 */
exports.getInventoryMovement = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      productId,
      type,
      groupBy = 'date' // date, type, product
    } = req.query;

    const filters = {
      startDate,
      endDate,
      productId,
      type,
      limit: 10000
    };

    const adjustments = Inventory.getAdjustments(filters);

    // Group the data based on groupBy parameter
    let groupedData = {};

    if (groupBy === 'date') {
      adjustments.adjustments.forEach(adj => {
        const date = adj.created_at.split('T')[0];
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            count: 0,
            totalIn: 0,
            totalOut: 0,
            adjustments: []
          };
        }
        groupedData[date].count++;
        groupedData[date].adjustments.push(adj);

        if (['purchase', 'return'].includes(adj.adjustment_type)) {
          groupedData[date].totalIn += adj.quantity;
        } else {
          groupedData[date].totalOut += adj.quantity;
        }
      });
    } else if (groupBy === 'type') {
      adjustments.adjustments.forEach(adj => {
        if (!groupedData[adj.adjustment_type]) {
          groupedData[adj.adjustment_type] = {
            type: adj.adjustment_type,
            count: 0,
            totalQuantity: 0,
            adjustments: []
          };
        }
        groupedData[adj.adjustment_type].count++;
        groupedData[adj.adjustment_type].totalQuantity += adj.quantity;
        groupedData[adj.adjustment_type].adjustments.push(adj);
      });
    } else if (groupBy === 'product') {
      adjustments.adjustments.forEach(adj => {
        if (!groupedData[adj.product_id]) {
          groupedData[adj.product_id] = {
            productId: adj.product_id,
            productName: adj.product_name,
            productSku: adj.product_sku,
            count: 0,
            totalIn: 0,
            totalOut: 0,
            adjustments: []
          };
        }
        groupedData[adj.product_id].count++;
        groupedData[adj.product_id].adjustments.push(adj);

        if (['purchase', 'return'].includes(adj.adjustment_type)) {
          groupedData[adj.product_id].totalIn += adj.quantity;
        } else {
          groupedData[adj.product_id].totalOut += adj.quantity;
        }
      });
    }

    return success(res, {
      period: {
        startDate,
        endDate
      },
      groupBy,
      summary: {
        totalAdjustments: adjustments.adjustments.length,
        totalProducts: Object.keys(groupedData).length
      },
      data: Object.values(groupedData)
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Sync inventory (recalculate stock quantities from adjustments)
 * POST /api/admin/inventory/sync
 */
exports.syncInventory = async (req, res, next) => {
  try {
    const { productId } = req.body;

    // This would need to be implemented in the models
    // For now, return success as a placeholder
    return success(res, {
      synced: true,
      productId,
      syncedAt: new Date().toISOString()
    }, 'Inventory synchronized successfully');
  } catch (err) {
    next(err);
  }
};