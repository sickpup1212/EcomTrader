/**
 * Trader Backend Server
 * Pipeline Rivers - Main application entry point
 * 
 * Like a river finding its path, this server routes all data flows
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { initializeSchema } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const {
  requestLogger,
  apiLogger,
  performanceMonitor,
  securityLogger
} = require('./middleware/logger');
const { warmupCache, startCacheMaintenance } = require('./middleware/cache');

// Import routes
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const adminProductRoutes = require('./routes/adminProducts');
const adminCategoryRoutes = require('./routes/adminCategories');
const adminInventoryRoutes = require('./routes/adminInventory');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database schema
initializeSchema();

// Initialize cache system
(async () => {
  try {
    console.log('Attempting to warm up cache...');
    await warmupCache();
    console.log('Cache warmup successful.');
    startCacheMaintenance();
  } catch (err) {
    console.error('[CACHE] Critical error during cache warmup, server might not function optimally:', err);
  }
})();

// Security middleware - First line of defense
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://postimg.cc", "https://i.postimg.cc"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Enhanced logging middleware
app.use(requestLogger);
app.use(securityLogger);
app.use(performanceMonitor);

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '..')));

// API Routes - The data flows through these channels
app.use('/api/health', healthRoutes);

// API-specific logging
app.use('/api', apiLogger);

// Public API endpoints
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Administrative API endpoints
app.use('/api/admin', adminRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/inventory', adminInventoryRoutes);

// Serve frontend HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/catalog', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'catalog.html'));
});

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'product-display.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'checkout.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-panel.html'));
});

// 404 handler
app.use(notFound);

// Error logger middleware - logs errors with context
app.use(require('./middleware/logger').errorLogger);

// Error handling middleware - catches any blockages in the flow
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║  🌊 Trader Backend - Pipeline Rivers - Enterprise E-commerce API          ║');
  console.log('╠════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Server flowing on port ${PORT}                                          ║`);
  console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}                                   ║`);
  console.log('║  Database: SQLite (WAL mode) with optimized indexing                 ║');
  console.log('║  Caching: Multi-tier intelligent caching system                       ║');
  console.log('║  Performance: Request monitoring & optimization                       ║');
  console.log('╠════════════════════════════════════════════════════════════════════════╣');
  console.log('║  🛍️  Public Product Endpoints:                                        ║');
  console.log('║  • GET    /api/products (filtering, pagination, search)               ║');
  console.log('║  • GET    /api/products/search                                       ║');
  console.log('║  • GET    /api/products/featured                                      ║');
  console.log('║  • GET    /api/products/:id                                          ║');
  console.log('║  • GET    /api/products/sku/:sku                                      ║');
  console.log('║  • GET    /api/products/slug/:slug                                    ║');
  console.log('║  • GET    /api/products/:id/inventory                                ║');
  console.log('║  • GET    /api/products/:id/related                                  ║');
  console.log('║  • GET/POST /api/products/:id/reviews                                 ║');
  console.log('║  • GET    /api/products/categories                                    ║');
  console.log('║  • GET    /api/products/categories/tree                               ║');
  console.log('║  • GET    /api/products/category/:categoryId                           ║');
  console.log('║                                                                      ║');
  console.log('║  📂 Public Category Endpoints:                                        ║');
  console.log('║  • GET    /api/categories (with product counts)                       ║');
  console.log('║  • GET    /api/categories/tree                                        ║');
  console.log('║  • GET    /api/categories/:id                                         ║');
  console.log('║  • GET    /api/categories/slug/:slug                                   ║');
  console.log('║  • GET    /api/categories/:id/breadcrumbs                             ║');
  console.log('║  • GET    /api/categories/:id/products                                ║');
  console.log('║                                                                      ║');
  console.log('║  🛒 Cart & Wishlist Endpoints:                                        ║');
  console.log('║  • GET/POST/PUT/DELETE /api/cart/*                                   ║');
  console.log('║  • GET/POST/DELETE   /api/wishlist/*                                 ║');
  console.log('║                                                                      ║');
  console.log('║  🔧 Admin Product Management:                                          ║');
  console.log('║  • GET    /api/admin/products (advanced filtering)                    ║');
  console.log('║  • POST   /api/admin/products                                        ║');
  console.log('║  • GET    /api/admin/products/:id                                     ║');
  console.log('║  • PUT    /api/admin/products/:id                                     ║');
  console.log('║  • DELETE /api/admin/products/:id                                     ║');
  console.log('║  • POST   /api/admin/products/:id/duplicate                           ║');
  console.log('║  • PUT    /api/admin/products/bulk                                    ║');
  console.log('║  • DELETE /api/admin/products/bulk                                   ║');
  console.log('║  • GET    /api/admin/products/status/:status                          ║');
  console.log('║  • GET    /api/admin/products/low-stock                              ║');
  console.log('║  • GET    /api/admin/products/reorder                                ║');
  console.log('║  • GET    /api/admin/products/search                                  ║');
  console.log('║  • GET    /api/admin/products/export                                  ║');
  console.log('║  • GET    /api/admin/products/stats                                   ║');
  console.log('║  • GET    /api/admin/products/:id/inventory                          ║');
  console.log('║  • PUT    /api/admin/products/:id/inventory                          ║');
  console.log('║                                                                      ║');
  console.log('║  📊 Inventory Management:                                              ║');
  console.log('║  • GET    /api/admin/inventory/adjustments                            ║');
  console.log('║  • POST   /api/admin/inventory/adjustments                            ║');
  console.log('║  • POST   /api/admin/inventory/adjustments/bulk                      ║');
  console.log('║  • GET    /api/admin/inventory/stats                                   ║');
  console.log('║  • GET    /api/admin/inventory/low-stock                              ║');
  console.log('║  • GET    /api/admin/inventory/reorder                                ║');
  console.log('║  • GET    /api/admin/inventory/alerts                                 ║');
  console.log('║  • PUT    /api/admin/inventory/alerts/:alertId/resolve               ║');
  console.log('║  • GET    /api/admin/inventory/products/:productId                    ║');
  console.log('║  • GET    /api/admin/inventory/value-by-category                     ║');
  console.log('║  • GET    /api/admin/inventory/export                                 ║');
  console.log('║  • GET    /api/admin/inventory/movement                               ║');
  console.log('║  • POST   /api/admin/inventory/sync                                  ║');
  console.log('║                                                                      ║');
  console.log('║  📁 Category Management:                                               ║');
  console.log('║  • GET/POST/PUT/DELETE /api/admin/categories/*                       ║');
  console.log('║  • GET    /api/admin/categories/tree                                 ║');
  console.log('║  • PUT    /api/admin/categories/reorder                              ║');
  console.log('║                                                                      ║');
  console.log('║  🏥 Health & System:                                                   ║');
  console.log('║  • GET    /api/health                                                 ║');
  console.log('║  • GET    /api/admin/stats                                            ║');
  console.log('║                                                                      ║');
  console.log('║  🚀 Performance Features:                                              ║');
  console.log('║  • Intelligent caching with automatic invalidation                   ║');
  console.log('║  • Request/response logging with unique IDs                           ║');
  console.log('║  • Performance monitoring and slow query detection                   ║');
  console.log('║  • Security monitoring and attack detection                          ║');
  console.log('║  • Database connection pooling and optimization                      ║');
  console.log('║                                                                      ║');
  console.log('║  🧪 Testing:                                                          ║');
  console.log('║  • Run: node test-api.js                                            ║');
  console.log('║  • Docs: API_DOCUMENTATION.md                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');
});

module.exports = app;
