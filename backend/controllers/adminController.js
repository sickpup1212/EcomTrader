/**
 * Admin Controller
 * Pipeline Rivers - Admin panel request handlers
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const Settings = require('../models/Settings');
const { success, created, notFound, paginated } = require('../utils/response');
const { parsePagination, parseSort, sanitizeSearch } = require('../utils/helpers');

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = Product.getStats();
    return success(res, stats);
  } catch (err) {
    next(err);
  }
};

/**
 * List all products (admin view)
 * GET /api/admin/products
 */
exports.listProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { field, order } = parseSort(req.query);
    const search = sanitizeSearch(req.query.search);

    const filters = {
      page,
      limit,
      search,
      category: req.query.category,
      status: req.query.status,
      sort: field,
      order
    };

    const { products, total } = await Product.getAll(filters);

    // Get filter options
    const categories = await Category.getWithCounts();
    const statuses = [
      { value: 'in_stock', count: products.filter(p => p.stock_status === 'in_stock').length },
      { value: 'low_stock', count: products.filter(p => p.stock_status === 'low_stock').length },
      { value: 'out_of_stock', count: products.filter(p => p.stock_status === 'out_of_stock').length }
    ];

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: {
          categories: categories.map(c => ({
            id: c.id,
            name: c.name,
            count: c.count
          })),
          statuses
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single product (admin view)
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
 * Create product
 * POST /api/admin/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    return created(res, product, 'Product created successfully');
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
    const product = await Product.update(req.params.id, req.body);

    if (!product) {
      return notFound(res, 'Product');
    }

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
    const deleted = await Product.delete(req.params.id);

    if (!deleted) {
      return notFound(res, 'Product');
    }

    return success(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk delete products
 * POST /api/admin/products/bulk-delete
 */
exports.bulkDeleteProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'productIds must be a non-empty array'
        }
      });
    }

    const deleted = Product.bulkDelete(productIds);

    return success(res, { deleted }, `${deleted} products deleted successfully`);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all categories
 * GET /api/admin/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.getAll();
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

/**
 * Get settings
 * GET /api/admin/settings
 */
exports.getSettings = async (req, res, next) => {
  try {
    const settings = Settings.get();
    return success(res, settings);
  } catch (err) {
    next(err);
  }
};

/**
 * Update settings
 * PUT /api/admin/settings
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = Settings.update(req.body);
    return success(res, settings, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};
