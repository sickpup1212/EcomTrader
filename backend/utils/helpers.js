/**
 * Helper Utilities
 * Pipeline Rivers - Common utility functions
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate unique ID with prefix
 */
function generateId(prefix = '') {
  const uuid = uuidv4().split('-')[0];
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Generate slug from string
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Calculate stock status based on quantity and threshold
 */
function calculateStockStatus(quantity, lowStockThreshold = 20) {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Parse pagination parameters
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 25));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Parse sort parameters
 */
function parseSort(query, allowedFields = ['name', 'price', 'stock', 'date']) {
  const sort = allowedFields.includes(query.sort) ? query.sort : 'name';
  const order = query.order === 'desc' ? 'DESC' : 'ASC';

  // Map sort fields to database columns
  const sortMap = {
    name: 'name',
    price: 'price_amount',
    stock: 'stock_quantity',
    date: 'created_at'
  };

  return {
    field: sortMap[sort] || 'name',
    order
  };
}

/**
 * Sanitize search query
 */
function sanitizeSearch(query) {
  if (!query) return '';
  return query.toString().trim().replace(/[%_]/g, '');
}

module.exports = {
  generateId,
  slugify,
  calculateStockStatus,
  parsePagination,
  parseSort,
  sanitizeSearch
};
