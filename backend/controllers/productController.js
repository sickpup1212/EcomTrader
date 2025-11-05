/**
 * Product Controller
 * Pipeline Rivers - Product request handlers
 *
 * Enhanced with comprehensive product management, filtering, and public-facing APIs
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { success, notFound, error, validationError } = require('../utils/response');
const { parsePagination, sanitizeSearch, slugify } = require('../utils/helpers');

/**
 * Get all products with filtering, sorting, and pagination
 * GET /api/products
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      category,
      status = 'active',
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = 'name',
      order = 'ASC'
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 items per page
      search: sanitizeSearch(search),
      category,
      status,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      featured: featured === 'true' ? true : undefined,
      sort,
      order: order.toUpperCase()
    };

    // Validate sort field
    const validSorts = ['name', 'price', 'date', 'rating', 'stock'];
    if (!validSorts.includes(filters.sort)) {
      return validationError(res, `Invalid sort field. Must be one of: ${validSorts.join(', ')}`);
    }

    // Validate order
    if (!['ASC', 'DESC'].includes(filters.order)) {
      return validationError(res, 'Order must be ASC or DESC');
    }

    const { products, total } = await Product.getAll(filters);

    const formattedProducts = await Promise.all(products.map(p => Product.formatProductSummary(p)));

    return success(res, {
      products: formattedProducts.filter(p => p),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        inStock,
        featured,
        sort,
        order
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single product by ID
 * GET /api/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return notFound(res, 'Product');
    }

    // Only return active products for public API
    if (product.status !== 'active' || !product.metadata.isActive) {
      return notFound(res, 'Product');
    }

    return success(res, { product });
  } catch (err) {
    next(err);
  }
};

/**
 * Get product by SKU
 * GET /api/products/sku/:sku
 */
exports.getProductBySku = async (req, res, next) => {
  try {
    const product = await Product.getBySku(req.params.sku);

    if (!product) {
      return notFound(res, 'Product');
    }

    // Only return active products for public API
    if (product.status !== 'active' || !product.metadata.isActive) {
      return notFound(res, 'Product');
    }

    return success(res, product);
  } catch (err) {
    next(err);
  }
};

/**
 * Get product by slug
 * GET /api/products/slug/:slug
 */
exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { products } = await Product.getAll({ search: slug, limit: 1 });

    if (!products || products.length === 0) {
      return notFound(res, 'Product');
    }

    const product = await Product.getById(products[0].id);

    if (!product || product.status !== 'active' || !product.metadata.isActive) {
      return notFound(res, 'Product');
    }

    return success(res, product);
  } catch (err) {
    next(err);
  }
};

/**
 * Get featured products
 * GET /api/products/featured
 */
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 12, category } = req.query;

    const filters = {
      page: 1,
      limit: Math.min(parseInt(limit), 50),
      category,
      status: 'active',
      featured: true,
      sort: 'name',
      order: 'ASC'
    };

    const { products, total } = await Product.getAll(filters);

    return success(res, {
      products: await Promise.all(products.map(p => Product.formatProductSummary(p))),
      count: products.length,
      category
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get related products (same category, different product)
 * GET /api/products/:id/related
 */
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return notFound(res, 'Product');
    }

    const { limit = 8 } = req.query;

    const filters = {
      page: 1,
      limit: Math.min(parseInt(limit), 20),
      category: product.category?.id,
      status: 'active',
      sort: 'name',
      order: 'ASC'
    };

    const { products, total } = await Product.getAll(filters);

    // Exclude the current product from related products
    const relatedProducts = products
      .filter(p => p.id !== req.params.id)
      .slice(0, parseInt(limit));

    return success(res, {
      products: await Promise.all(relatedProducts.map(p => Product.formatProductSummary(p))),
      count: relatedProducts.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get product inventory status (public version)
 * GET /api/products/:id/inventory
 */
exports.getProductInventory = async (req, res, next) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return notFound(res, 'Product');
    }

    // Only return basic stock info for public API
    const stockInfo = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: {
        quantity: product.stock.quantity,
        status: product.stock.status,
        isInStock: product.stock.status === 'in_stock',
        isLowStock: product.stock.status === 'low_stock',
        isOutOfStock: product.stock.status === 'out_of_stock'
      },
      metadata: {
        updatedAt: product.metadata.updatedAt
      }
    };

    return success(res, stockInfo);
  } catch (err) {
    next(err);
  }
};

/**
 * Search products with advanced filters
 * GET /api/products/search
 */
exports.searchProducts = async (req, res, next) => {
  try {
    const {
      q: query,
      category,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 25,
      sort = 'relevance',
      order = 'DESC'
    } = req.query;

    if (!query) {
      return validationError(res, 'Search query is required');
    }

    const filters = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      search: sanitizeSearch(query),
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      status: 'active',
      sort: sort === 'relevance' ? 'name' : sort,
      order
    };

    const { products, total } = await Product.getAll(filters);

    return success(res, {
      query,
      products: await Promise.all(products.map(p => Product.formatProductSummary(p))),
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
 * Get products by category with hierarchy support
 * GET /api/products/category/:categoryId
 */
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 25, sort = 'name', order = 'ASC' } = req.query;

    // Validate category exists
    const category = await Category.getById(categoryId);
    if (!category) {
      return notFound(res, 'Category');
    }

    const filters = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sort,
      order,
      includeSubcategories: req.query.includeSubcategories !== 'false'
    };

    const result = await Category.getProducts(categoryId, filters);

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
 * Get product reviews
 * GET /api/products/:id/reviews
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'date', order = 'DESC' } = req.query;
    const { reviews, total } = await Review.getByProductId(
      req.params.id,
      parseInt(page),
      parseInt(limit),
      sort,
      order
    );

    return success(res, {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create product review
 * POST /api/products/:id/reviews
 */
exports.createReview = async (req, res, next) => {
  try {
    // Validate product exists and is active
    const product = await Product.getById(req.params.id);
    if (!product) {
      return notFound(res, 'Product');
    }

    if (product.status !== 'active') {
      return validationError(res, 'Cannot review inactive products');
    }

    const { rating, title, content, authorName } = req.body;

    // Validate required fields
    if (!rating || !content || !authorName) {
      return validationError(res, 'Rating, content, and author name are required');
    }

    if (rating < 1 || rating > 5) {
      return validationError(res, 'Rating must be between 1 and 5');
    }

    const reviewId = await Review.create({
      productId: req.params.id,
      rating: parseInt(rating),
      title,
      content,
      authorName
    });

    return success(res, { id: reviewId }, 'Review created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get product categories with product counts
 * GET /api/products/categories
 */
exports.getProductCategories = async (req, res, next) => {
  try {
    const { includeEmpty = false } = req.query;

    const categories = await Category.getWithCounts();

    const filteredCategories = includeEmpty === 'true'
      ? categories
      : categories.filter(cat => cat.product_count > 0);

    return success(res, {
      categories: filteredCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.image_url,
        productCount: cat.product_count,
        parent: cat.parent_name ? {
          name: cat.parent_name,
          slug: cat.parent_slug
        } : undefined
      }))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get product categories tree structure
 * GET /api/products/categories/tree
 */
exports.getProductCategoriesTree = async (req, res, next) => {
  try {
    const tree = await Category.getTree();

    const enrichTreeWithCounts = async (nodes) => {
        const categoriesWithCounts = await Category.getWithCounts();
        return Promise.all(nodes.map(async (node) => {
            const categoryWithCount = categoriesWithCounts.find(cat => cat.id === node.id);
            const children = node.children.length > 0 ? await enrichTreeWithCounts(node.children) : undefined;
            return {
                id: node.id,
                name: node.name,
                slug: node.slug,
                description: node.description,
                imageUrl: node.image_url,
                productCount: categoryWithCount?.product_count || 0,
                children
            };
        }));
    };

    const enrichedTree = await enrichTreeWithCounts(tree);

    return success(res, {
      categories: enrichedTree
    });
  } catch (err) {
    next(err);
  }
};
