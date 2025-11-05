/**
 * Admin Product Controller
 * Pipeline Rivers - Administrative product management
 *
 * Handles all administrative product operations including CRUD,
 * bulk operations, and advanced product management
 */

const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { success, notFound, error, validationError } = require('../utils/response');
const { parsePagination, parseSort, sanitizeSearch } = require('../utils/helpers');

/**
 * Get all products with advanced filtering and pagination
 * GET /api/admin/products
 */
exports.getProducts = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 25,
      search: sanitizeSearch(req.query.search),
      category: req.query.category,
      status: req.query.status,
      sort: req.query.sort || 'name',
      order: req.query.order || 'ASC'
    };

    const { products, total } = await Product.getAll(filters);

    return success(res, {
      products: products,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single product by ID
 * GET /api/admin/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return notFound(res, 'Product');
    }

    return success(res, product);
  } catch (err) {
    next(err);
  }
};

/**
 * Create new product
 * POST /api/admin/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    // Validate required fields
    const required = ['name', 'description', 'categoryId', 'sku'];
    const missing = required.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return validationError(res, `Missing required fields: ${missing.join(', ')}`);
    }

    // Check if SKU already exists
    const existingProduct = await Product.getBySku(req.body.sku);
    if (existingProduct) {
      return validationError(res, 'SKU already exists');
    }

    const product = await Product.create(req.body);

    return success(res, product, 'Product created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update product
 * PUT /api/admin/products/:id
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const existingProduct = await Product.getById(req.params.id);

    if (!existingProduct) {
      return notFound(res, 'Product');
    }

    // If updating SKU, check if it already exists
    if (req.body.sku && req.body.sku !== existingProduct.sku) {
      const existingSku = await Product.getBySku(req.body.sku);
      if (existingSku) {
        return validationError(res, 'SKU already exists');
      }
    }

    const product = await Product.update(req.params.id, req.body);

    return success(res, product, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const existingProduct = await Product.getById(req.params.id);

    if (!existingProduct) {
      return notFound(res, 'Product');
    }

    const deleted = await Product.delete(req.params.id);

    if (!deleted) {
      return error(res, 'Failed to delete product', 500);
    }

    return success(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk delete products
 * DELETE /api/admin/products/bulk
 */
exports.bulkDeleteProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return validationError(res, 'Product IDs array is required');
    }

    const deletedCount = await Product.bulkDelete(productIds);

    return success(res, {
      deletedCount,
      productIds
    }, `${deletedCount} products deleted successfully`);
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk update products
 * PUT /api/admin/products/bulk
 */
exports.bulkUpdateProducts = async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return validationError(res, 'Updates array is required');
    }

    const results = [];

    for (const update of updates) {
      try {
        const product = await Product.update(update.id, update.data);
        results.push({ id: update.id, success: true, product });
      } catch (err) {
        results.push({ id: update.id, success: false, error: err.message });
      }
    }

    return success(res, { results }, 'Bulk update completed');
  } catch (err) {
    next(err);
  }
};

/**
 * Duplicate product
 * POST /api/admin/products/:id/duplicate
 */
exports.duplicateProduct = async (req, res, next) => {
  try {
    const originalProduct = await Product.getById(req.params.id);

    if (!originalProduct) {
      return notFound(res, 'Product');
    }

    // Create duplicate with modified data
    const duplicateData = {
      ...originalProduct,
      name: `${originalProduct.name} (Copy)`,
      sku: `${originalProduct.sku}-copy`,
      images: originalProduct.images,
      variants: originalProduct.variants,
      features: originalProduct.features,
      specifications: originalProduct.specifications
    };

    // Remove fields that shouldn't be copied
    delete duplicateData.id;
    delete duplicateData.slug;
    delete duplicateData.metadata;

    const duplicatedProduct = await Product.create(duplicateData);

    return success(res, duplicatedProduct, 'Product duplicated successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get products by status
 * GET /api/admin/products/status/:status
 */
exports.getProductsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const validStatuses = ['active', 'inactive', 'discontinued'];

    if (!validStatuses.includes(status)) {
      return validationError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 25,
      status: status,
      sort: req.query.sort || 'name',
      order: req.query.order || 'ASC'
    };

    const { products, total } = await Product.getAll(filters);

    return success(res, {
      products,
      status,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get low stock products
 * GET /api/admin/products/low-stock
 */
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Inventory.getLowStockProducts();

    return success(res, {
      products,
      count: products.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get products that need reordering
 * GET /api/admin/products/reorder
 */
exports.getReorderProducts = async (req, res, next) => {
  try {
    const products = await Inventory.getReorderProducts();

    return success(res, {
      products,
      count: products.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get product statistics
 * GET /api/admin/products/stats
 */
exports.getProductStats = async (req, res, next) => {
  try {
    const stats = await Product.getStats();
    const inventoryStats = await Inventory.getInventoryStats();

    return success(res, {
      products: stats,
      inventory: inventoryStats,
      alerts: {
        lowStock: inventoryStats.lowStockProducts,
        outOfStock: inventoryStats.outOfStockProducts,
        reorder: inventoryStats.reorderProducts
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Search products (advanced search)
 * GET /api/admin/products/search
 */
exports.searchProducts = async (req, res, next) => {
  try {
    const {
      q: query,
      category,
      minPrice,
      maxPrice,
      inStock,
      status,
      page = 1,
      limit = 25,
      sort = 'name',
      order = 'ASC'
    } = req.query;

    if (!query) {
      return validationError(res, 'Search query is required');
    }

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      search: sanitizeSearch(query),
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      status,
      sort,
      order
    };

    const { products, total } = await Product.getAll(filters);

    return success(res, {
      products,
      query,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export products data
 * GET /api/admin/products/export
 */
exports.exportProducts = async (req, res, next) => {
  try {
    const { format = 'json', category, status } = req.query;

    const filters = {
      category,
      status,
      // Set high limit for export
      limit: 10000
    };

    const { products } = await Product.getAll(filters);

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'ID,SKU,Name,Category,Price,Stock,Status,Created At\n';
      const csvData = products.map(p =>
        `${p.id},${p.sku},"${p.name}","${p.category?.name || ''}",${p.price.amount},${p.stock.quantity},${p.status},${p.metadata.createdAt}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
      return res.send(csvHeader + csvData);
    } else {
      // Default JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="products.json"');
      return res.json({
        exportedAt: new Date().toISOString(),
        count: products.length,
        products
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get product inventory information
 * GET /api/admin/products/:id/inventory
 */
exports.getProductInventory = async (req, res, next) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return notFound(res, 'Product');
    }

    const inventory = await Inventory.getProductInventory(req.params.id);

    return success(res, inventory);
  } catch (err) {
    next(err);
  }
};

/**
 * Update product inventory
 * PUT /api/admin/products/:id/inventory
 */
exports.updateProductInventory = async (req, res, next) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return notFound(res, 'Product');
    }

    const { type, quantity, reason, notes } = req.body;

    if (!type || !quantity || !reason) {
      return validationError(res, 'Type, quantity, and reason are required');
    }

    const adjustmentId = await Inventory.createAdjustment({
      productId: req.params.id,
      type,
      quantity: parseInt(quantity),
      reason,
      notes: notes || null,
      createdBy: req.user?.id || 'admin'
    });

    const updatedInventory = await Inventory.getProductInventory(req.params.id);

    return success(res, {
      adjustmentId,
      inventory: updatedInventory
    }, 'Inventory updated successfully');
  } catch (err) {
    next(err);
  }
};
