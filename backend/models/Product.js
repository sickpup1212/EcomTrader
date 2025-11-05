/**
 * Product Model
 * Pipeline Rivers - Product data access layer
 * 
 * Handles all database operations for products
 */

const { db } = require('../config/database');
const { generateId, slugify, calculateStockStatus } = require('../utils/helpers');

class Product {
  /**
   * Get single product by ID with all related data
   */
  static getById(id) {
    const product = db.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        parent.name as parent_category_name,
        parent.slug as parent_category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE p.id = ?
    `).get(id);

    if (!product) return null;

    return this.formatProduct(product);
  }

  /**
   * Get product by SKU
   */
  static getBySku(sku) {
    const product = db.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.sku = ?
    `).get(sku);

    if (!product) return null;
    return this.formatProduct(product);
  }

  /**
   * Get all products with pagination and filters
   */
  static getAll(filters = {}) {
    const {
      page = 1,
      limit = 25,
      search,
      category,
      status,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = 'name',
      order = 'ASC'
    } = filters;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Search filter
    if (search) {
      whereClause += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category) {
      whereClause += ` AND p.category_id = ?`;
      params.push(category);
    }

    // Status filter
    if (status) {
      whereClause += ` AND p.status = ?`;
      params.push(status);
    }

    // Price range filter
    if (minPrice !== undefined) {
      whereClause += ` AND p.price_amount >= ?`;
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      whereClause += ` AND p.price_amount <= ?`;
      params.push(maxPrice);
    }

    // Stock status filter
    if (inStock === true) {
      whereClause += ` AND p.stock_quantity > 0`;
    } else if (inStock === false) {
      whereClause += ` AND p.stock_quantity = 0`;
    }

    // Featured filter
    if (featured) {
      whereClause += ` AND p.is_featured = 1`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    // Determine sort field
    let sortField;
    switch (sort) {
      case 'price':
        sortField = 'price_amount';
        break;
      case 'date':
        sortField = 'created_at';
        break;
      case 'rating':
        sortField = 'rating_average';
        break;
      case 'stock':
        sortField = 'stock_quantity';
        break;
      default:
        sortField = 'name';
    }

    // Get products
    const query = `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sortField} ${order}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(query).all(...params, limit, offset);

    return {
      products,
      total
    };
  }

  /**
   * Create new product
   */
  static create(data) {
    const id = generateId('prod');
    const slug = slugify(data.name);
    const stockStatus = calculateStockStatus(data.stock?.quantity || 0, data.stock?.lowStockThreshold);

    const stmt = db.prepare(`
      INSERT INTO products (
        id, sku, name, slug, description, short_description,
        category_id, price_amount, price_currency, price_original_amount,
        discount_percentage, discount_amount, stock_quantity, stock_status,
        stock_low_threshold, reorder_level, weight, length, width, height,
        dimensions_unit, colors, sizes, status, is_active, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.sku,
      data.name,
      slug,
      data.description,
      data.shortDescription || null,
      data.categoryId,
      data.price.amount,
      data.price.currency || 'USD',
      data.price.originalAmount || null,
      data.price.discount?.percentage || null,
      data.price.discount?.amount || null,
      data.stock?.quantity || 0,
      stockStatus,
      data.stock?.lowStockThreshold || 20,
      data.stock?.reorderLevel || 10,
      data.weight || null,
      data.length || null,
      data.width || null,
      data.height || null,
      data.dimensions?.unit || 'cm',
      data.colors ? JSON.stringify(data.colors) : null,
      data.sizes ? JSON.stringify(data.sizes) : null,
      data.status || 'active',
      data.isActive !== false ? 1 : 0,
      data.isFeatured ? 1 : 0
    );

    // Add images
    if (data.images && data.images.length > 0) {
      this.addImages(id, data.images);
    }

    // Add variants
    if (data.variants && data.variants.length > 0) {
      this.addVariants(id, data.variants);
    }

    // Add features
    if (data.features && data.features.length > 0) {
      this.addFeatures(id, data.features);
    }

    // Add specifications
    if (data.specifications) {
      this.addSpecifications(id, data.specifications);
    }

    return this.getById(id);
  }

  /**
   * Update product
   */
  static update(id, data) {
    const updates = [];
    const params = [];

    // Map camelCase fields to snake_case database columns
    const fieldMapping = {
      shortDescription: 'short_description',
      categoryId: 'category_id',
      isFeatured: 'is_featured'
    };

    for (const key in data) {
      if (key === 'id') continue;

      let dbField = fieldMapping[key] || key;

      // Handle nested objects
      if (key === 'price' && typeof data[key] === 'object') {
        if (data[key].amount !== undefined) {
          updates.push('price_amount = ?');
          params.push(data[key].amount);
        }
        if (data[key].currency) {
          updates.push('price_currency = ?');
          params.push(data[key].currency);
        }
        if (data[key].originalAmount !== undefined) {
          updates.push('price_original_amount = ?');
          params.push(data[key].originalAmount);
        }
      } else if (key === 'stock' && typeof data[key] === 'object') {
        if (data[key].quantity !== undefined) {
          updates.push('stock_quantity = ?');
          params.push(data[key].quantity);
        }
        if (data[key].status) {
          updates.push('stock_status = ?');
          params.push(data[key].status);
        }
        if (data[key].lowStockThreshold !== undefined) {
          updates.push('stock_low_threshold = ?');
          params.push(data[key].lowStockThreshold);
        }
        if (data[key].reorderLevel !== undefined) {
          updates.push('reorder_level = ?');
          params.push(data[key].reorderLevel);
        }
      } else if (key === 'images' && Array.isArray(data[key])) {
        updates.push('images = ?');
        params.push(JSON.stringify(data[key]));
      } else if (dbField === 'is_featured') {
        updates.push(`${dbField} = ?`);
        params.push(data[key] ? 1 : 0);
      } else {
        updates.push(`${dbField} = ?`);
        params.push(data[key]);
      }
    }

    params.push(id);

    if (updates.length === 0) {
      return this.getById(id);
    }

    const stmt = db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(params);

    return this.getById(id);
  }

  /**
   * Delete product
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Bulk delete products
   */
  static bulkDelete(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);
    return result.changes;
  }

  /**
   * Add images to product
   */
  static addImages(productId, images) {
    const stmt = db.prepare(`
      INSERT INTO product_images (id, product_id, url, alt, display_order, thumbnail_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    images.forEach((img, index) => {
      stmt.run(
        generateId('img'),
        productId,
        img.url,
        img.alt,
        img.order !== undefined ? img.order : index,
        img.thumbnail || null
      );
    });
  }

  /**
   * Format product from DB
   */
  static formatProduct(product) {
    // Get images
    const images = db.prepare(`
      SELECT id, url, alt, display_order as 'order', thumbnail_url as thumbnail
      FROM product_images
      WHERE product_id = ?
      ORDER BY display_order
    `).all(product.id);

    // Get variants
    const variants = db.prepare(`
      SELECT type, name, value, metadata
      FROM product_variants
      WHERE product_id = ?
    `).all(product.id).map(v => ({
      ...v,
      metadata: v.metadata ? JSON.parse(v.metadata) : undefined
    }));

    // Get features
    const features = db.prepare(`
      SELECT icon, title, description
      FROM product_features
      WHERE product_id = ?
      ORDER BY display_order
    `).all(product.id);

    // Get specifications
    const specs = db.prepare(`
      SELECT spec_key, spec_value
      FROM product_specifications
      WHERE product_id = ?
    `).all(product.id);

    const specifications = {};
    specs.forEach(spec => {
      specifications[spec.spec_key] = spec.spec_value;
    });

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.short_description,
      price: {
        amount: product.price_amount,
        currency: product.price_currency,
        originalAmount: product.price_original_amount,
        discount: product.discount_percentage ? {
          percentage: product.discount_percentage,
          amount: product.discount_amount
        } : undefined
      },
      images,
      category: {
        id: product.category_id,
        name: product.category_name,
        slug: product.category_slug,
        parent: product.parent_category_name ? {
          name: product.parent_category_name,
          slug: product.parent_category_slug
        } : undefined
      },
      stock: {
        quantity: product.stock_quantity,
        status: product.stock_status,
        lowStockThreshold: product.stock_low_threshold,
        reorderLevel: product.reorder_level
      },
      physical: {
        weight: product.weight,
        dimensions: (product.length || product.width || product.height) ? {
          length: product.length,
          width: product.width,
          height: product.height,
          unit: product.dimensions_unit
        } : undefined
      },
      attributes: {
        colors: product.colors ? JSON.parse(product.colors) : undefined,
        sizes: product.sizes ? JSON.parse(product.sizes) : undefined
      },
      status: product.status,
      rating: {
        average: product.rating_average,
        count: product.rating_count
      },
      variants: variants.length > 0 ? variants : undefined,
      features: features.length > 0 ? features : undefined,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      metadata: {
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        isActive: Boolean(product.is_active),
        isFeatured: Boolean(product.is_featured)
      }
    };
  }

  /**
   * Format product summary (for lists)
   */
  static formatProductSummary(product) {
    // Get first image only
    const image = db.prepare(`
      SELECT url, alt
      FROM product_images
      WHERE product_id = ?
      ORDER BY display_order
      LIMIT 1
    `).get(product.id);

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      images: image ? [image] : [],
      category: {
        id: product.category_id,
        name: product.category_name
      },
      price: {
        amount: product.price_amount,
        currency: product.price_currency
      },
      stock: {
        quantity: product.stock_quantity,
        status: product.stock_status
      },
      metadata: {
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    };
  }

  /**
   * Get statistics
   */
  static getStats() {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN stock_status = 'low_stock' THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN stock_status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock,
        SUM(price_amount * stock_quantity) as total_value
      FROM products
      WHERE is_active = 1
    `).get();

    return {
      totalProducts: {
        value: stats.total_products,
        change: { percentage: 12, direction: 'up', period: 'month' }
      },
      lowStock: {
        value: stats.low_stock,
        critical: Math.floor(stats.low_stock * 0.2)
      },
      outOfStock: {
        value: stats.out_of_stock
      },
      totalValue: {
        amount: stats.total_value || 0,
        currency: 'USD',
        change: { percentage: 8, direction: 'up', period: 'month' }
      }
    };
  }
}

module.exports = Product;
