/**
 * Database Configuration
 * Pipeline Rivers - Data flow architecture
 * 
 * SQLite database setup with connection pooling and query optimization
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/trader.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Enable WAL mode for better concurrency and foreign keys enforcement
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA synchronous = NORMAL;');
  db.run('PRAGMA cache_size = 10000;');
  db.run('PRAGMA temp_store = MEMORY;');
  db.run('PRAGMA foreign_keys = ON;');
});

/**
 * Initialize database schema
 */
function initializeSchema() {
  db.serialize(() => {
    // Enhanced Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        short_description TEXT,
        category_id TEXT NOT NULL,

        -- Pricing
        price_amount REAL NOT NULL,
        price_currency TEXT NOT NULL DEFAULT 'USD',
        price_original_amount REAL,
        discount_percentage INTEGER,
        discount_amount REAL,

        -- Inventory management
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        stock_status TEXT NOT NULL DEFAULT 'in_stock',
        stock_low_threshold INTEGER DEFAULT 20,
        reorder_level INTEGER DEFAULT 10,

        -- Product metadata
        weight REAL,
        length REAL,
        width REAL,
        height REAL,
        dimensions_unit TEXT DEFAULT 'cm',
        colors TEXT,
        sizes TEXT,

        -- Status and flags
        status TEXT NOT NULL DEFAULT 'active',
        is_active INTEGER DEFAULT 1,
        is_featured INTEGER DEFAULT 0,

        -- Ratings
        rating_average REAL DEFAULT 0,
        rating_count INTEGER DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),

        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Product images table
    db.run(`
      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        url TEXT NOT NULL,
        alt TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        thumbnail_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Product variants table
    db.run(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Product features table
    db.run(`
      CREATE TABLE IF NOT EXISTS product_features (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        icon TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Product specifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS product_specifications (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        spec_key TEXT NOT NULL,
        spec_value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_verified INTEGER DEFAULT 0,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        title TEXT,
        content TEXT NOT NULL,
        helpful_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Cart items table (session-based)
    db.run(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        selected_variants TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Wishlist items table
    db.run(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(session_id, product_id)
      )
    `);

    // Admin settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        display_products_per_page INTEGER DEFAULT 25,
        display_show_images INTEGER DEFAULT 1,
        display_show_stock INTEGER DEFAULT 1,
        display_show_descriptions INTEGER DEFAULT 0,
        display_compact_view INTEGER DEFAULT 0,
        alerts_low_stock_threshold INTEGER DEFAULT 20,
        alerts_email_on_low_stock INTEGER DEFAULT 1,
        alerts_email_on_out_of_stock INTEGER DEFAULT 1,
        alerts_notification_email TEXT,
        sorting_default_sort TEXT DEFAULT 'name',
        sorting_default_order TEXT DEFAULT 'asc',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Enhanced Categories table with hierarchy support
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_id TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Inventory adjustments log
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        adjustment_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT NOT NULL,
        notes TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Low stock alerts
    db.run(`
      CREATE TABLE IF NOT EXISTS low_stock_alerts (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        alert_type TEXT NOT NULL DEFAULT 'low_stock',
        current_quantity INTEGER NOT NULL,
        threshold INTEGER NOT NULL,
        is_resolved INTEGER DEFAULT 0,
        resolved_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Insert default settings if not exists
    db.run(`
      INSERT OR IGNORE INTO admin_settings (id) VALUES (1)
    `);

    // Enhanced indexes for performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(stock_status);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_amount);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(stock_quantity);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_wishlist_session ON wishlist_items(session_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product ON inventory_adjustments(product_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created ON inventory_adjustments(created_at);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product ON low_stock_alerts(product_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_resolved ON low_stock_alerts(is_resolved);`);

    console.log('✓ Database schema initialized');
  });
}

/**
 * Close database connection gracefully
 */
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('✓ Database connection closed');
  });
}

module.exports = {
  db,
  initializeSchema,
  closeDatabase
};
