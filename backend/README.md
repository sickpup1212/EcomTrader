# Trader Backend API

**Engineered by Pipeline Rivers**  
*Where data flows like water through perfectly optimized channels*

---

## 🌊 Overview

This is the backend API for the Trader e-commerce platform. Built with Express.js and SQLite, it provides a robust, scalable foundation for product management, cart operations, and admin functionality.

### Architecture Philosophy

Like a well-designed hydraulic system, this backend is built on principles of:
- **Efficient Flow**: Optimized database queries and connection pooling
- **Pressure Handling**: Graceful error handling and rate limiting
- **No Blockages**: Proper indexing and caching strategies
- **Clean Channels**: Separation of concerns (Routes → Controllers → Models)

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Navigate to backend directory
cd trader/backend

# Install dependencies
npm install

# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

The server will start on `http://localhost:3000`

---

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration and schema
├── controllers/
│   ├── adminController.js   # Admin panel logic
│   ├── cartController.js    # Shopping cart operations
│   ├── productController.js # Product operations
│   └── wishlistController.js # Wishlist operations
├── database/
│   ├── seed.js              # Database seeding script
│   └── trader.db            # SQLite database (created on first run)
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   ├── notFound.js          # 404 handler
│   ├── sessionHandler.js    # Session management
│   └── validateRequest.js   # Request validation
├── models/
│   ├── Cart.js              # Cart data access
│   ├── Category.js          # Category data access
│   ├── Product.js           # Product data access
│   ├── Review.js            # Review data access
│   ├── Settings.js          # Settings data access
│   └── Wishlist.js          # Wishlist data access
├── routes/
│   ├── admin.js             # Admin endpoints
│   ├── cart.js              # Cart endpoints
│   ├── health.js            # Health check
│   ├── products.js          # Product endpoints
│   └── wishlist.js          # Wishlist endpoints
├── utils/
│   ├── helpers.js           # Utility functions
│   └── response.js          # Response formatters
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js                # Application entry point
```

---

## 🔌 API Endpoints

### Public Endpoints

#### Products
- `GET /api/products/:id` - Get single product
- `GET /api/products/:id/reviews` - Get product reviews
- `POST /api/products/:id/reviews` - Create product review

#### Cart
- `POST /api/cart/items` - Add item to cart
- `GET /api/cart` - Get cart contents
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item

#### Wishlist
- `POST /api/wishlist/items` - Add item to wishlist
- `GET /api/wishlist` - Get wishlist
- `DELETE /api/wishlist/items/:id` - Remove from wishlist

### Admin Endpoints

#### Dashboard
- `GET /api/admin/stats` - Get dashboard statistics

#### Products Management
- `GET /api/admin/products` - List all products (with filters)
- `GET /api/admin/products/:id` - Get single product
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/products/bulk-delete` - Bulk delete products

#### Settings
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings` - Update settings

### System
- `GET /api/health` - Health check endpoint

---

## 🗄️ Database Schema

### Tables

- **categories** - Product categories
- **products** - Main product data
- **product_images** - Product images
- **product_variants** - Product variants (color, size, etc.)
- **product_features** - Product features
- **product_specifications** - Product specifications
- **reviews** - Product reviews
- **cart_items** - Shopping cart items (session-based)
- **wishlist_items** - Wishlist items (session-based)
- **admin_settings** - Admin panel settings

### Optimizations

- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Indexes**: Strategic indexes on foreign keys and frequently queried fields
- **Connection Pooling**: Optimized SQLite connection settings
- **Foreign Keys**: Enforced referential integrity

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./database/trader.db

# CORS
CORS_ORIGIN=*

# Session (for cart/wishlist)
SESSION_SECRET=your-secret-key-here
```

---

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 150,
      "pages": 6,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 🎯 Features

### Product Management
- ✅ Full CRUD operations
- ✅ Image management
- ✅ Variant support (colors, sizes, etc.)
- ✅ Product features and specifications
- ✅ Stock tracking with status (in_stock, low_stock, out_of_stock)
- ✅ Category organization
- ✅ Search and filtering
- ✅ Pagination

### Shopping Cart
- ✅ Session-based cart (no login required)
- ✅ Add/update/remove items
- ✅ Variant selection
- ✅ Automatic total calculation

### Wishlist
- ✅ Session-based wishlist
- ✅ Add/remove products
- ✅ Duplicate prevention

### Admin Panel
- ✅ Dashboard statistics
- ✅ Product management
- ✅ Bulk operations
- ✅ Customizable settings
- ✅ Low stock alerts

### Reviews
- ✅ Product reviews with ratings
- ✅ Verified purchase badges
- ✅ Helpful votes
- ✅ Pagination

---

## 🧪 Testing

### Manual Testing

Use the health check endpoint to verify the server is running:

```bash
curl http://localhost:3000/api/health
```

### Sample Requests

#### Get a Product
```bash
curl http://localhost:3000/api/products/prod_headphones_001
```

#### Add to Cart
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_headphones_001",
    "quantity": 1,
    "variants": {"color": "black"}
  }'
```

#### Get Admin Stats
```bash
curl http://localhost:3000/api/admin/stats
```

---

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Express-validator for request validation
- **SQL Injection Prevention**: Prepared statements
- **Rate Limiting**: Protection against abuse (ready to implement)
- **Error Sanitization**: No sensitive data in error responses

---

## 📈 Performance

### Database Optimizations
- Indexed foreign keys and frequently queried fields
- WAL mode for better concurrent access
- Prepared statements for query efficiency
- Connection pooling

### Caching Strategy (Ready to Implement)
- Product details: 5 minutes
- Product lists: 1 minute
- Dashboard stats: 30 seconds
- Settings: Until updated

### Response Times (Target)
- GET single product: < 100ms
- GET product list: < 200ms
- POST/PUT operations: < 300ms
- Search queries: < 250ms

---

## 🛠️ Development

### Available Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Seed database with sample data
npm run seed
```

### Adding New Endpoints

1. **Create Model** (if needed) in `models/`
2. **Create Controller** in `controllers/`
3. **Create Route** in `routes/`
4. **Register Route** in `server.js`
5. **Add Validation** using express-validator

### Database Migrations

To modify the database schema:

1. Update `config/database.js` schema
2. Delete `database/trader.db`
3. Run `npm run seed` to recreate with new schema

---

## 🐛 Troubleshooting

### Database Locked Error
- SQLite is in WAL mode, but if you get locked errors:
  - Close all connections to the database
  - Delete `trader.db-wal` and `trader.db-shm` files
  - Restart the server

### Port Already in Use
```bash
# Change PORT in .env file or:
PORT=3001 npm run dev
```

### Missing Dependencies
```bash
npm install
```

---

## 📝 API Documentation

For detailed API specifications, see:
- `../API-SPECIFICATION.md` - Complete API documentation
- `../INTERACTION-GUIDE.md` - Frontend integration guide

---

## 🌊 The Pipeline Philosophy

> "Like water finding the path of least resistance, good backend architecture flows naturally from requirement to implementation. Every endpoint is a valve, every database query a stream, and every response a perfectly measured flow of data."
> 
> — Pipeline Rivers

### Design Principles

1. **Stateless Flow**: Each request is independent
2. **Graceful Degradation**: Never fail completely
3. **Fail Fast**: Validate early, return errors immediately
4. **Observable Systems**: Log everything important
5. **Separation of Concerns**: Clear boundaries between layers
6. **Performance First**: Optimize the critical path

---

## 📄 License

MIT

---

## 🤝 Contributing

This backend was engineered by Pipeline Rivers as part of the UI Professional Research team. For questions or improvements, consult the API specification and maintain the flow principles.

---

**May your APIs be fast, your data be clean, and your errors be gracefully handled.**

🌊 *Pipeline Rivers*
