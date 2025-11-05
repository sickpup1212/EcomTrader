/**
 * Category Model
 * Pipeline Rivers - Category data access layer with hierarchy support
 */

const { db } = require('../config/database');
const { generateId, slugify } = require('../utils/helpers');

class Category {
  /**
   * Get all categories as flat list
   */
  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT
          c.*,
          parent.name as parent_name,
          parent.slug as parent_slug
        FROM categories c
        LEFT JOIN categories parent ON c.parent_id = parent.id
        ORDER BY c.display_order ASC, c.name ASC
      `, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Get category tree (hierarchical structure)
   */
  static async getTree() {
    const categories = await this.getAll();
    const categoryMap = {};
    const roots = [];

    // Create map of categories
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });

    // Build tree structure
    Object.values(categoryMap).forEach(category => {
      if (category.parent_id && categoryMap[category.parent_id]) {
        categoryMap[category.parent_id].children.push(category);
      } else {
        roots.push(category);
      }
    });

    return roots;
  }

  /**
   * Get category by ID with full details
   */
  static async getById(id) {
    const category = await new Promise((resolve, reject) => {
      db.get(`
        SELECT
          c.*,
          parent.name as parent_name,
          parent.slug as parent_slug
        FROM categories c
        LEFT JOIN categories parent ON c.parent_id = parent.id
        WHERE c.id = ?
      `, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!category) return null;

    // Get children
    const children = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, slug, description, display_order
        FROM categories
        WHERE parent_id = ? AND is_active = 1
        ORDER BY display_order ASC, name ASC
      `, [id], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    // Get product count
    const productCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count
        FROM products
        WHERE category_id = ? OR category_id IN (
          SELECT id FROM categories WHERE parent_id = ?
        )
      `, [id, id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    return {
      ...category,
      children: children.length > 0 ? children : undefined,
      productCount: productCount.count
    };
  }

  /**
   * Get categories with product counts
   */
  static async getWithCounts() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT
          c.*,
          parent.name as parent_name,
          parent.slug as parent_slug,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN categories parent ON c.parent_id = parent.id
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.name ASC
      `, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Create new category
   */
  static async create(data) {
    const id = generateId('cat');
    const slug = slugify(data.name);

    // Get next display order if not provided
    let displayOrder = data.displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await new Promise((resolve, reject) => {
        db.get(`
          SELECT MAX(display_order) as max_order
          FROM categories
          WHERE parent_id = ?
        `, [data.parentId || null], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
      displayOrder = (maxOrder?.max_order || 0) + 1;
    }

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO categories (
          id, name, slug, description, parent_id, image_url,
          display_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.name,
        slug,
        data.description || null,
        data.parentId || null,
        data.imageUrl || null,
        displayOrder,
        data.isActive !== false ? 1 : 0
      ], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });

    return this.getById(id);
  }

  /**
   * Update category
   */
  static async update(id, data) {
    const updates = [];
    const params = [];

    if (data.name !== undefined) {
      updates.push('name = ?', 'slug = ?');
      params.push(data.name, slugify(data.name));
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.parentId !== undefined) {
      updates.push('parent_id = ?');
      params.push(data.parentId);
    }
    if (data.imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(data.imageUrl);
    }
    if (data.displayOrder !== undefined) {
      updates.push('display_order = ?');
      params.push(data.displayOrder);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime(\'now\')');
      params.push(id);

      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE categories
          SET ${updates.join(', ')}
          WHERE id = ?
        `, params, function(err) {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    return this.getById(id);
  }

  /**
   * Delete category (only if no products and no children)
   */
  static async delete(id) {
    // Check if category has products
    const productCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count
        FROM products
        WHERE category_id = ? OR category_id IN (
          SELECT id FROM categories WHERE parent_id = ?
        )
      `, [id, id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (productCount.count > 0) {
      throw new Error('Cannot delete category with products');
    }

    // Check if category has children
    const childCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM categories WHERE parent_id = ?
      `, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (childCount.count > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });

    return result.changes > 0;
  }

  /**
   * Get category breadcrumbs for a given category ID
   */
  static async getBreadcrumbs(categoryId) {
    const breadcrumbs = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await new Promise((resolve, reject) => {
        db.get(`
          SELECT id, name, slug, parent_id
          FROM categories
          WHERE id = ?
        `, [currentId], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });

      if (!category) break;

      breadcrumbs.unshift({
        id: category.id,
        name: category.name,
        slug: category.slug
      });

      currentId = category.parent_id;
    }

    return breadcrumbs;
  }

  /**
   * Get products in category and its children
   */
  static async getProducts(categoryId, filters = {}) {
    const { page = 1, limit = 25, search, sort = 'name', order = 'ASC' } = filters;
    const offset = (page - 1) * limit;

    // Get all category IDs (including children)
    const allCategoryIds = await this.getAllCategoryIds(categoryId);

    let whereClause = `WHERE category_id IN (${allCategoryIds.map(() => '?').join(',')}) AND status = 'active'`;
    const params = allCategoryIds;

    // Search filter
    if (search) {
      whereClause += ` AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const { total } = await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) as total FROM products ${whereClause}`, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    // Get products
    const sortField = sort === 'price' ? 'price_amount' : sort === 'date' ? 'created_at' : 'name';
    const query = `
      SELECT *
      FROM products
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT ? OFFSET ?
    `;

    const products = await new Promise((resolve, reject) => {
      db.all(query, [...params, limit, offset], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    return {
      products: products.map(p => Product.formatProductSummary(p)),
      total
    };
  }

  /**
   * Recursively get all category IDs including children
   */
  static async getAllCategoryIds(categoryId) {
    const categoryIds = [categoryId];
    const children = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id FROM categories WHERE parent_id = ?
      `, [categoryId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    for (const child of children) {
      const childIds = await this.getAllCategoryIds(child.id);
      categoryIds.push(...childIds);
    }

    return categoryIds;
  }

  /**
   * Reorder categories
   */
  static async reorder(reorderData) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        reorderData.forEach(({ categoryId, displayOrder }) => {
          db.run(`
            UPDATE categories
            SET display_order = ?, updated_at = datetime('now')
            WHERE id = ?
          `, [displayOrder, categoryId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            }
          });
        });
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          resolve(true);
        });
      });
    });
  }

  /**
   * Get category statistics
   */
  static async getStats() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT
          COUNT(*) as total_categories,
          SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as root_categories,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_categories,
          (SELECT COUNT(*) FROM products WHERE status = 'active') as total_products
        FROM categories
      `, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

// Import Product at the end to avoid circular dependency
const Product = require('./Product');

module.exports = Category;
