/**
 * Product Model
 * Pipeline Rivers - Product data access layer
 *
 * Manages all product-related database operations
 */

const { db } = require('../config/database');
const { generateId, slugify } = require('../utils/helpers');

class Product {
  /**
   * Get all products with filters
   */
  static async getAll(filters = {}) {
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

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereClauses.push('p.category_id = ?');
      params.push(category);
    }

    if (status) {
      whereClauses.push('p.status = ?');
      params.push(status);
    }

    if (minPrice !== undefined) {
      whereClauses.push('p.price_amount >= ?');
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      whereClauses.push('p.price_amount <= ?');
      params.push(maxPrice);
    }

    if (inStock !== undefined) {
      whereClauses.push('p.stock_status = ?');
      params.push(inStock ? 'in_stock' : 'out_of_stock');
    }

    if (featured !== undefined) {
      whereClauses.push('p.is_featured = ?');
      params.push(featured ? 1 : 0);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const totalResult = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
    const total = totalResult.total;

    const validSorts = ['name', 'price_amount', 'created_at', 'stock_quantity'];
    const sortField = validSorts.includes(sort) ? sort : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const products = await new Promise((resolve, reject) => {
      db.all(query, [...params, limit, offset], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    return { products: products || [], total };
  }

  /**
   * Get product by ID
   */
  static async getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row ? this.formatProduct(row) : null);
      });
    });
  }

  /**
   * Get product by SKU
   */
  static async getBySku(sku) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE sku = ?', [sku], (err, row) => {
        if (err) return reject(err);
        resolve(row ? this.formatProduct(row) : null);
      });
    });
  }

  /**
   * Create new product
   */
  static async create(data) {
    // Validate category exists
    if (data.categoryId) {
      const categoryExists = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM categories WHERE id = ?', [data.categoryId], (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        });
      });

      if (!categoryExists) {
        throw new Error(`Category with ID '${data.categoryId}' does not exist`);
      }
    }

    const id = generateId('prod');
    const slug = slugify(data.name);
    const sku = data.sku || `${slug.toUpperCase()}-${Math.random().toString(36).substr(2, 4)}`;

    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, slug, sku, description, short_description, category_id,
        price_amount, price_currency, price_original_amount,
        stock_quantity, stock_status,
        images, is_featured, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await new Promise((resolve, reject) => {
      stmt.run(
        id, data.name, slug, sku, data.description, data.shortDescription, data.categoryId,
        data.price.amount, data.price.currency, data.price.originalAmount,
        data.stock.quantity, data.stock.status || 'in_stock',
        JSON.stringify(data.images), data.isFeatured ? 1 : 0, data.status
      , function(err) {
        if (err) return reject(err);
        resolve();
      });
    });

    return this.getById(id);
  }

  /**
   * Update product
   */
  static async update(id, data) {
    let updates = [];
    let params = [];

    // Flatten nested objects and map camelCase fields to snake_case database columns
    const fieldMapping = {
      shortDescription: 'short_description',
      categoryId: 'category_id',
      isFeatured: 'is_featured',
      isActive: 'is_active'
    };

    // Handle nested price object
    if (data.price) {
      if (data.price.amount !== undefined) {
        updates.push('price_amount = ?');
        params.push(data.price.amount);
      }
      if (data.price.currency) {
        updates.push('price_currency = ?');
        params.push(data.price.currency);
      }
      if (data.price.originalAmount !== undefined) {
        updates.push('price_original_amount = ?');
        params.push(data.price.originalAmount);
      }
    }

    // Handle nested stock object
    if (data.stock) {
      if (data.stock.quantity !== undefined) {
        updates.push('stock_quantity = ?');
        params.push(data.stock.quantity);
      }
      if (data.stock.lowStockThreshold !== undefined) {
        updates.push('stock_low_threshold = ?');
        params.push(data.stock.lowStockThreshold);
      }
      if (data.stock.reorderLevel !== undefined) {
        updates.push('reorder_level = ?');
        params.push(data.stock.reorderLevel);
      }
    }

    // Handle images field (convert array to JSON string)
    if (data.images !== undefined) {
      updates.push('images = ?');
      params.push(JSON.stringify(data.images));
    }

    // Handle other top-level fields
    for (const key in data) {
      if (key === 'id' || key === 'price' || key === 'stock' || key === 'images') continue;

      // Use mapped field name or original key
      const fieldName = fieldMapping[key] || key;
      updates.push(`${fieldName} = ?`);
      params.push(data[key]);
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(id);

    const stmt = db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`);
    await new Promise((resolve, reject) => {
      stmt.run(params, function(err) {
        if (err) return reject(err);
        resolve();
      });
    });

    return this.getById(id);
  }

  /**
   * Delete product
   */
  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Format product from DB
   */
  static formatProduct(product) {
    if (!product) return null;
    return {
      ...product,
      price: {
        amount: product.price_amount,
        currency: product.price_currency,
        originalAmount: product.price_original_amount
      },
      stock: {
        quantity: product.stock_quantity,
        status: product.stock_status
      },
      images: JSON.parse(product.images || '[]'),
      isFeatured: !!product.is_featured,
      metadata: {
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    };
  }

  /**
   * Format product for summary view
   */
  static async formatProductSummary(product) {
    if (!product) return null;

    const category = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, slug FROM categories WHERE id = ?', [product.category_id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    const reviews = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count, AVG(rating) as average FROM reviews WHERE product_id = ?', [product.id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.short_description,
      price: {
        amount: product.price_amount,
        currency: product.price_currency,
        originalAmount: product.price_original_amount,
      },
      stock: {
        status: product.stock_status,
        isInStock: product.stock_status === 'in_stock'
      },
      images: JSON.parse(product.images || '[]'),
      category: category || null,
      rating: {
        average: reviews.average || 0,
        count: reviews.count || 0,
      },
      isFeatured: !!product.is_featured,
    };
  }

  static async getStats() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT
          COUNT(*) as total_products,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_products,
          SUM(CASE WHEN stock_status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_products,
          SUM(CASE WHEN stock_status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_products,
          (SELECT COUNT(*) FROM categories) as total_categories
        FROM products
      `, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = Product;
