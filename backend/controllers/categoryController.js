/**
 * Category Controller
 * Pipeline Rivers - Category request handlers
 *
 * Enhanced with comprehensive category management, hierarchy support, and validation
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const { success, notFound, validationError } = require('../utils/response');
const { sanitizeSearch } = require('../utils/helpers');

/**
 * Get all categories (public version)
 * GET /api/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const { includeEmpty = false } = req.query;

    let categories = Category.getAll();

    // Filter only active categories for public API
    categories = categories.filter(cat => cat.is_active === 1);

    // Filter empty categories if requested
    if (includeEmpty !== 'true') {
      categories = categories.filter(cat => cat.product_count > 0);
    }

    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.image_url,
      displayOrder: cat.display_order,
      parent: cat.parent_name ? {
        id: cat.parent_id,
        name: cat.parent_name,
        slug: cat.parent_slug
      } : undefined
    }));

    return success(res, {
      categories: formattedCategories
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get category tree structure (public version)
 * GET /api/categories/tree
 */
exports.getCategoryTree = async (req, res, next) => {
  try {
    const { includeEmpty = false, includeInactive = false } = req.query;

    let tree = Category.getTree();

    // Filter based on parameters
    const filterTree = (nodes) => {
      return nodes
        .filter(node => {
          // Keep if active or includeInactive is true
          const isActive = includeInactive === 'true' || node.is_active === 1;
          // Keep if has products or includeEmpty is true
          const hasProducts = includeEmpty === 'true' || (node.product_count && node.product_count > 0);
          return isActive && hasProducts;
        })
        .map(node => ({
          id: node.id,
          name: node.name,
          slug: node.slug,
          description: node.description,
          imageUrl: node.image_url,
          displayOrder: node.display_order,
          productCount: node.product_count || 0,
          children: node.children && node.children.length > 0 ? filterTree(node.children) : undefined
        }));
    };

    const filteredTree = filterTree(tree);

    return success(res, {
      categories: filteredTree
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get category breadcrumbs
 * GET /api/categories/:id/breadcrumbs
 */
exports.getCategoryBreadcrumbs = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = Category.getById(id);
    if (!category || !category.is_active) {
      return notFound(res, 'Category');
    }

    const breadcrumbs = Category.getBreadcrumbs(id);

    return success(res, {
      breadcrumbs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single category by ID (public version)
 * GET /api/categories/:id
 */
exports.getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = Category.getById(id);

    if (!category || !category.is_active) {
      return notFound(res, 'Category');
    }

    // Format category for public API
    const formattedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      displayOrder: category.display_order,
      productCount: category.productCount,
      parent: category.parent_name ? {
        id: category.parent_id,
        name: category.parent_name,
        slug: category.parent_slug
      } : undefined,
      children: category.children && category.children.length > 0
        ? category.children.map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description,
          productCount: child.productCount || 0
        }))
        : undefined
    };

    return success(res, formattedCategory);
  } catch (err) {
    next(err);
  }
};

/**
 * Get category by slug
 * GET /api/categories/slug/:slug
 */
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const categories = Category.getAll();
    const category = categories.find(cat => cat.slug === slug && cat.is_active === 1);

    if (!category) {
      return notFound(res, 'Category');
    }

    // Get full category details
    const fullCategory = Category.getById(category.id);
    if (!fullCategory || !fullCategory.is_active) {
      return notFound(res, 'Category');
    }

    // Format category for public API
    const formattedCategory = {
      id: fullCategory.id,
      name: fullCategory.name,
      slug: fullCategory.slug,
      description: fullCategory.description,
      imageUrl: fullCategory.image_url,
      displayOrder: fullCategory.display_order,
      productCount: fullCategory.productCount,
      parent: fullCategory.parent_name ? {
        id: fullCategory.parent_id,
        name: fullCategory.parent_name,
        slug: fullCategory.parent_slug
      } : undefined,
      children: fullCategory.children && fullCategory.children.length > 0
        ? fullCategory.children.map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description,
          productCount: child.productCount || 0
        }))
        : undefined
    };

    return success(res, formattedCategory);
  } catch (err) {
    next(err);
  }
};

/**
 * Get products in category with hierarchy support
 * GET /api/categories/:id/products
 */
exports.getCategoryProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 25,
      search,
      sort = 'name',
      order = 'ASC',
      minPrice,
      maxPrice,
      inStock,
      includeSubcategories = true
    } = req.query;

    // Validate category exists and is active
    const category = Category.getById(id);
    if (!category || !category.is_active) {
      return notFound(res, 'Category');
    }

    const filters = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      search: sanitizeSearch(search),
      category: includeSubcategories === 'false' ? id : undefined, // If includeSubcategories is false, use specific category
      sort,
      order: order.toUpperCase(),
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      status: 'active'
    };

    let result;

    if (includeSubcategories === 'false') {
      // Get products only from this specific category
      const { products, total } = Product.getAll(filters);
      result = { products, total };
    } else {
      // Get products from this category and all subcategories
      result = Category.getProducts(id, filters);
    }

    // Format products for public API
    const formattedProducts = result.products.map(p => Product.formatProductSummary(p));

    return success(res, {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      },
      products: formattedProducts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      },
      filters: {
        search,
        sort,
        order,
        minPrice,
        maxPrice,
        inStock,
        includeSubcategories: includeSubcategories !== 'false'
      }
    });
  } catch (err) {
    next(err);
  }
};