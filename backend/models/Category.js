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
  static getAll() {
    return db.prepare(`
      SELECT
        c.*,
        parent.name as parent_name,
        parent.slug as parent_slug
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      ORDER BY c.display_order ASC, c.name ASC
    `).all();
  }

  /**
   * Get category tree (hierarchical structure)
   */
  static getTree() {
    const categories = this.getAll();
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
  static getById(id) {
    const category = db.prepare(`
      SELECT
        c.*,
        parent.name as parent_name,
        parent.slug as parent_slug
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.id = ?
    `).get(id);

    if (!category) return null;

    // Get children
    const children = db.prepare(`
      SELECT id, name, slug, description, display_order
      FROM categories
      WHERE parent_id = ? AND is_active = 1
      ORDER BY display_order ASC, name ASC
    `).all(id);

    // Get product count
    const productCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE category_id = ? OR category_id IN (
        SELECT id FROM categories WHERE parent_id = ?
      )
    `).get(id, id);

    return {
      ...category,
      children: children.length > 0 ? children : undefined,
      productCount: productCount.count
    };
  }

  /**
   * Get categories with product counts
   */
  static getWithCounts() {
    return db.prepare(`
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
    `).all();
  }

  /**
   * Create new category
   */
  static create(data) {
    const id = generateId('cat');
    const slug = slugify(data.name);

    // Get next display order if not provided
    let displayOrder = data.displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = db.prepare(`
        SELECT MAX(display_order) as max_order
        FROM categories
        WHERE parent_id = ?
      `).get(data.parentId || null);
      displayOrder = (maxOrder?.max_order || 0) + 1;
    }

    const stmt = db.prepare(`
      INSERT INTO categories (
        id, name, slug, description, parent_id, image_url,
        display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      slug,
      data.description || null,
      data.parentId || null,
      data.imageUrl || null,
      displayOrder,
      data.isActive !== false ? 1 : 0
    );

    return this.getById(id);
  }

  /**
   * Update category
   */
  static update(id, data) {
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

      const stmt = db.prepare(`
        UPDATE categories
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
      stmt.run(...params);
    }

    return this.getById(id);
  }

  /**
   * Delete category (only if no products and no children)
   */
  static delete(id) {
    // Check if category has products
    const productCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE category_id = ? OR category_id IN (
        SELECT id FROM categories WHERE parent_id = ?
      )
    `).get(id, id);

    if (productCount.count > 0) {
      throw new Error('Cannot delete category with products');
    }

    // Check if category has children
    const childCount = db.prepare(`
      SELECT COUNT(*) as count FROM categories WHERE parent_id = ?
    `).get(id);

    if (childCount.count > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get category breadcrumbs for a given category ID
   */
  static getBreadcrumbs(categoryId) {
    const breadcrumbs = [];
    let currentId = categoryId;

    while (currentId) {
      const category = db.prepare(`
        SELECT id, name, slug, parent_id
        FROM categories
        WHERE id = ?
      `).get(currentId);

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
  static getProducts(categoryId, filters = {}) {
    const { page = 1, limit = 25, search, sort = 'name', order = 'ASC' } = filters;
    const offset = (page - 1) * limit;

    // Get all category IDs (including children)
    const allCategoryIds = this.getAllCategoryIds(categoryId);

    let whereClause = `WHERE category_id IN (${allCategoryIds.map(() => '?').join(',')}) AND status = 'active'`;
    const params = allCategoryIds;

    // Search filter
    if (search) {
      whereClause += ` AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    // Get products
    const sortField = sort === 'price' ? 'price_amount' : sort === 'date' ? 'created_at' : 'name';
    const query = `
      SELECT *
      FROM products
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(query).all(...params, limit, offset);

    return {
      products: products.map(p => Product.formatProductSummary(p)),
      total
    };
  }

  /**
   * Recursively get all category IDs including children
   */
  static getAllCategoryIds(categoryId) {
    const categoryIds = [categoryId];
    const children = db.prepare(`
      SELECT id FROM categories WHERE parent_id = ?
    `).all(categoryId);

    children.forEach(child => {
      categoryIds.push(...this.getAllCategoryIds(child.id));
    });

    return categoryIds;
  }

  /**
   * Reorder categories
   */
  static reorder(reorderData) {
    const transaction = db.transaction(() => {
      reorderData.forEach(({ categoryId, displayOrder }) => {
        db.prepare(`
          UPDATE categories
          SET display_order = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(displayOrder, categoryId);
      });
    });

    transaction();
    return true;
  }

  /**
   * Get category statistics
   */
  static getStats() {
    return db.prepare(`
      SELECT
        COUNT(*) as total_categories,
        SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as root_categories,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_categories,
        (SELECT COUNT(*) FROM products WHERE status = 'active') as total_products
      FROM categories
    `).get();
  }
}

// Import Product at the end to avoid circular dependency
const Product = require('./Product');

module.exports = Category;
