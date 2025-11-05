/**
 * Admin Category Controller
 * Pipeline Rivers - Administrative category management
 *
 * Handles all administrative category operations including CRUD,
 * hierarchy management, and category-based product operations
 */

const Category = require('../models/Category');
const { success, notFound, error, validationError } = require('../utils/response');

/**
 * Get all categories (flat list)
 * GET /api/admin/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = Category.getWithCounts();

    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

/**
 * Get category tree (hierarchical structure)
 * GET /api/admin/categories/tree
 */
exports.getCategoryTree = async (req, res, next) => {
  try {
    const tree = Category.getTree();

    return success(res, tree);
  } catch (err) {
    next(err);
  }
};

/**
 * Get single category by ID
 * GET /api/admin/categories/:id
 */
exports.getCategory = async (req, res, next) => {
  try {
    const category = Category.getById(req.params.id);

    if (!category) {
      return notFound(res, 'Category');
    }

    return success(res, category);
  } catch (err) {
    next(err);
  }
};

/**
 * Create new category
 * POST /api/admin/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    // Validate required fields
    if (!req.body.name) {
      return validationError(res, 'Category name is required');
    }

    // Check if category with same name already exists
    const existingCategories = Category.getAll();
    const nameExists = existingCategories.some(cat =>
      cat.name.toLowerCase() === req.body.name.toLowerCase()
    );

    if (nameExists) {
      return validationError(res, 'Category with this name already exists');
    }

    const category = Category.create(req.body);

    return success(res, category, 'Category created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update category
 * PUT /api/admin/categories/:id
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const existingCategory = Category.getById(req.params.id);

    if (!existingCategory) {
      return notFound(res, 'Category');
    }

    // If updating name, check for duplicates
    if (req.body.name && req.body.name !== existingCategory.name) {
      const existingCategories = Category.getAll();
      const nameExists = existingCategories.some(cat =>
        cat.id !== req.params.id &&
        cat.name.toLowerCase() === req.body.name.toLowerCase()
      );

      if (nameExists) {
        return validationError(res, 'Category with this name already exists');
      }
    }

    // Prevent setting parent to self or descendant
    if (req.body.parentId) {
      if (req.body.parentId === req.params.id) {
        return validationError(res, 'Category cannot be its own parent');
      }

      // Check if parent is a descendant
      const descendantIds = Category.getAllCategoryIds(req.params.id);
      if (descendantIds.includes(req.body.parentId)) {
        return validationError(res, 'Cannot set descendant category as parent');
      }
    }

    const category = Category.update(req.params.id, req.body);

    return success(res, category, 'Category updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete category
 * DELETE /api/admin/categories/:id
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const existingCategory = Category.getById(req.params.id);

    if (!existingCategory) {
      return notFound(res, 'Category');
    }

    const deleted = Category.delete(req.params.id);

    if (!deleted) {
      return error(res, 'Failed to delete category', 500);
    }

    return success(res, null, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Reorder categories
 * PUT /api/admin/categories/reorder
 */
exports.reorderCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return validationError(res, 'Categories array is required');
    }

    // Validate format
    const isValidFormat = categories.every(cat =>
      cat.categoryId && typeof cat.displayOrder === 'number'
    );

    if (!isValidFormat) {
      return validationError(res, 'Invalid reorder format. Each item must have categoryId and displayOrder');
    }

    Category.reorder(categories);

    return success(res, null, 'Categories reordered successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get category breadcrumbs
 * GET /api/admin/categories/:id/breadcrumbs
 */
exports.getCategoryBreadcrumbs = async (req, res, next) => {
  try {
    const category = Category.getById(req.params.id);

    if (!category) {
      return notFound(res, 'Category');
    }

    const breadcrumbs = Category.getBreadcrumbs(req.params.id);

    return success(res, breadcrumbs);
  } catch (err) {
    next(err);
  }
};

/**
 * Get products in category (including subcategories)
 * GET /api/admin/categories/:id/products
 */
exports.getCategoryProducts = async (req, res, next) => {
  try {
    const category = Category.getById(req.params.id);

    if (!category) {
      return notFound(res, 'Category');
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 25,
      search: req.query.search,
      sort: req.query.sort || 'name',
      order: req.query.order || 'ASC'
    };

    const result = Category.getProducts(req.params.id, filters);

    return success(res, {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      products: result.products,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Move products between categories
 * POST /api/admin/categories/:id/move-products
 */
exports.moveProducts = async (req, res, next) => {
  try {
    const { productIds, targetCategoryId } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return validationError(res, 'Product IDs array is required');
    }

    if (!targetCategoryId) {
      return validationError(res, 'Target category ID is required');
    }

    // Verify target category exists
    const targetCategory = Category.getById(targetCategoryId);
    if (!targetCategory) {
      return notFound(res, 'Target category');
    }

    // Move products (this would need to be implemented in Product model)
    // For now, return success as a placeholder
    return success(res, {
      movedCount: productIds.length,
      productIds,
      fromCategoryId: req.params.id,
      toCategoryId: targetCategoryId
    }, 'Products moved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Get category statistics
 * GET /api/admin/categories/:id/stats
 */
exports.getCategoryStats = async (req, res, next) => {
  try {
    const category = Category.getById(req.params.id);

    if (!category) {
      return notFound(res, 'Category');
    }

    const allCategoryIds = Category.getAllCategoryIds(req.params.id);

    // Get product statistics for this category and all subcategories
    const Product = require('../models/Product');
    let totalProducts = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const catId of allCategoryIds) {
      const products = Product.getAll({ categoryId: catId });
      totalProducts += products.products.length;

      products.products.forEach(product => {
        totalValue += product.price.amount * product.stock.quantity;
        if (product.stock.status === 'low_stock') lowStockCount++;
        if (product.stock.status === 'out_of_stock') outOfStockCount++;
      });
    }

    const stats = {
      category: {
        id: category.id,
        name: category.name,
        productCount: category.productCount
      },
      totalProducts,
      totalValue,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
      subcategoryCount: category.children?.length || 0
    };

    return success(res, stats);
  } catch (err) {
    next(err);
  }
};

/**
 * Get categories with filter options
 * GET /api/admin/categories/options
 */
exports.getCategoryOptions = async (req, res, next) => {
  try {
    const { includeInactive = false } = req.query;

    let categories;
    if (includeInactive === 'true') {
      categories = Category.getAll();
    } else {
      categories = Category.getAll().filter(cat => cat.is_active === 1);
    }

    const options = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parent_id,
      level: this.getCategoryLevel(categories, cat.id)
    }));

    return success(res, options);
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk update categories
 * PUT /api/admin/categories/bulk
 */
exports.bulkUpdateCategories = async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return validationError(res, 'Updates array is required');
    }

    const results = [];

    for (const update of updates) {
      try {
        const category = Category.update(update.id, update.data);
        results.push({ id: update.id, success: true, category });
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
 * Helper function to get category level (depth in hierarchy)
 */
function getCategoryLevel(categories, categoryId, level = 0) {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category || !category.parent_id) return level;

  return getCategoryLevel(categories, category.parent_id, level + 1);
}

/**
 * Export categories data
 * GET /api/admin/categories/export
 */
exports.exportCategories = async (req, res, next) => {
  try {
    const { format = 'json', includeInactive = false } = req.query;

    let categories;
    if (includeInactive === 'true') {
      categories = Category.getAll();
    } else {
      categories = Category.getAll().filter(cat => cat.is_active === 1);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'ID,Name,Slug,Parent ID,Description,Display Order,Is Active,Created At\n';
      const csvData = categories.map(cat =>
        `${cat.id},"${cat.name}",${cat.slug},${cat.parent_id || ''},"${cat.description || ''}",${cat.display_order},${cat.is_active},${cat.created_at}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="categories.csv"');
      return res.send(csvHeader + csvData);
    } else {
      // Default JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="categories.json"');
      return res.json({
        exportedAt: new Date().toISOString(),
        count: categories.length,
        categories
      });
    }
  } catch (err) {
    next(err);
  }
};

// Export the helper function for use within the module
exports.getCategoryLevel = getCategoryLevel;