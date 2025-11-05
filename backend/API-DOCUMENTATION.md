# E-commerce Product Management API Documentation

## Overview

This comprehensive REST API provides full product management capabilities for an e-commerce platform, including inventory tracking, category management, and administrative operations.

**Base URL**: `http://localhost:3000/api`

## Architecture

- **Node.js/Express.js** backend
- **SQLite** database with WAL mode for performance
- **Input validation** using express-validator
- **Comprehensive error handling** and logging
- **Database transactions** for inventory operations

## Authentication

Currently, the API operates without authentication middleware. In production, implement JWT or session-based authentication for admin endpoints.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "abc-123"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": [ /* validation errors */ ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "pages": 4
  }
}
```

---

## Public API Endpoints

### Products

#### Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (1-100, default: 25)
- `search` (string, optional): Search term
- `category` (uuid, optional): Filter by category ID
- `status` (string, optional): Filter by status (active, inactive)
- `sort` (string, optional): Sort field (name, price, stock, date, rating)
- `order` (string, optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_abc123",
        "sku": "SKU-001",
        "name": "Product Name",
        "images": [{ "url": "image.jpg", "alt": "Product image" }],
        "category": {
          "id": "cat_def456",
          "name": "Category Name"
        },
        "price": {
          "amount": 29.99,
          "currency": "USD"
        },
        "stock": {
          "quantity": 50,
          "status": "in_stock"
        },
        "metadata": {
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 100,
      "pages": 4
    }
  }
}
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Get Product Reviews
```http
GET /api/products/:id/reviews
```

#### Create Product Review
```http
POST /api/products/:id/reviews
```

**Body:**
```json
{
  "author": {
    "name": "John Doe"
  },
  "rating": 5,
  "title": "Great product!",
  "content": "Excellent quality and fast shipping."
}
```

### Categories

#### Get All Categories
```http
GET /api/categories
```

#### Get Category Tree
```http
GET /api/categories/tree
```

#### Get Single Category
```http
GET /api/categories/:id
```

#### Get Products in Category
```http
GET /api/categories/:id/products
```

---

## Administrative API Endpoints

### Products Management

#### Get All Products (Admin)
```http
GET /api/admin/products
```

#### Create Product
```http
POST /api/admin/products
```

**Body:**
```json
{
  "sku": "SKU-001",
  "name": "Product Name",
  "description": "Detailed product description",
  "shortDescription": "Brief description",
  "categoryId": "cat_def456",
  "price": {
    "amount": 29.99,
    "currency": "USD",
    "originalAmount": 39.99,
    "discount": {
      "percentage": 25,
      "amount": 10.00
    }
  },
  "stock": {
    "quantity": 50,
    "lowStockThreshold": 20,
    "reorderLevel": 10
  },
  "weight": 1.5,
  "dimensions": {
    "length": 10,
    "width": 8,
    "height": 3,
    "unit": "cm"
  },
  "colors": ["red", "blue", "green"],
  "sizes": ["S", "M", "L", "XL"],
  "status": "active",
  "isActive": true,
  "isFeatured": false,
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "Product image 1",
      "order": 0
    }
  ],
  "variants": [
    {
      "type": "color",
      "name": "Color",
      "value": "red"
    }
  ],
  "features": [
    {
      "icon": "check",
      "title": "Feature 1",
      "description": "Feature description"
    }
  ],
  "specifications": {
    "material": "Cotton",
    "origin": "Made in USA"
  }
}
```

#### Update Product
```http
PUT /api/admin/products/:id
```

#### Delete Product
```http
DELETE /api/admin/products/:id
```

#### Bulk Operations
```http
PUT /api/admin/products/bulk
DELETE /api/admin/products/bulk
```

#### Search Products (Advanced)
```http
GET /api/admin/products/search
```

#### Export Products
```http
GET /api/admin/products/export?format=json|csv
```

#### Duplicate Product
```http
POST /api/admin/products/:id/duplicate
```

### Category Management

#### Get All Categories (Admin)
```http
GET /api/admin/categories
```

#### Get Category Tree
```http
GET /api/admin/categories/tree
```

#### Create Category
```http
POST /api/admin/categories
```

**Body:**
```json
{
  "name": "Category Name",
  "description": "Category description",
  "parentId": "parent_category_uuid",
  "imageUrl": "https://example.com/category.jpg",
  "displayOrder": 1,
  "isActive": true
}
```

#### Update Category
```http
PUT /api/admin/categories/:id
```

#### Delete Category
```http
DELETE /api/admin/categories/:id
```

#### Reorder Categories
```http
PUT /api/admin/categories/reorder
```

#### Move Products Between Categories
```http
POST /api/admin/categories/:id/move-products
```

### Inventory Management

#### Get Inventory Statistics
```http
GET /api/admin/inventory/stats
```

#### Get Inventory Adjustments
```http
GET /api/admin/inventory/adjustments
```

#### Create Inventory Adjustment
```http
POST /api/admin/inventory/adjustments
```

**Body:**
```json
{
  "productId": "prod_abc123",
  "type": "purchase",
  "quantity": 100,
  "reason": "New stock received",
  "notes": "Supplier: ABC Company"
}
```

**Adjustment Types:**
- `purchase`: Stock received from supplier
- `sale`: Stock sold to customer
- `return`: Customer return
- `damage`: Damaged items
- `theft`: Stolen items
- `adjustment`: Manual adjustment
- `transfer`: Stock transfer between locations

#### Bulk Inventory Adjustments
```http
POST /api/admin/inventory/adjustments/bulk
```

#### Get Low Stock Products
```http
GET /api/admin/inventory/low-stock
```

#### Get Reorder Products
```http
GET /api/admin/inventory/reorder
```

#### Get Inventory Alerts
```http
GET /api/admin/inventory/alerts
```

#### Resolve Inventory Alert
```http
PUT /api/admin/inventory/alerts/:alertId/resolve
```

#### Export Inventory Data
```http
GET /api/admin/inventory/export
```

#### Inventory Movement Reports
```http
GET /api/admin/inventory/movement
```

---

## Database Schema

### Products Table
```sql
CREATE TABLE products (
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
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Categories Table (Hierarchical)
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Inventory Adjustments Table
```sql
CREATE TABLE inventory_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  adjustment_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Low Stock Alerts Table
```sql
CREATE TABLE low_stock_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'low_stock',
  current_quantity INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  is_resolved INTEGER DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Duplicate entry (e.g., SKU already exists)
- `INSUFFICIENT_STOCK`: Not enough stock for operation
- `FOREIGN_KEY_CONSTRAINT`: Invalid reference (e.g., category doesn't exist)
- `DATABASE_ERROR`: Database operation failed

---

## Performance Optimizations

1. **Database Indexes**: Optimized indexes on frequently queried fields
2. **WAL Mode**: SQLite Write-Ahead Logging for better concurrency
3. **Connection Pooling**: Efficient database connection management
4. **Pagination**: All list endpoints support pagination
5. **Query Optimization**: Efficient SQL queries with proper JOINs

---

## Security Considerations

1. **Input Sanitization**: All inputs are validated and sanitized
2. **SQL Injection Prevention**: Parameterized queries used throughout
3. **CORS**: Configured for cross-origin requests
4. **Rate Limiting**: Express rate limiting middleware
5. **Security Headers**: Helmet middleware for security headers

---

## Getting Started

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Start Server**:
   ```bash
   npm run dev  # Development with nodemon
   npm start    # Production
   ```

3. **Initialize Database**:
   ```bash
   npm run seed  # Run database seeds
   ```

4. **Access API**:
   - Base URL: `http://localhost:3000/api`
   - Health Check: `GET /api/health`

---

## Testing

Test the API using:
- **Postman**: Import the provided collection
- **cURL**: Command line requests
- **Browser**: For GET endpoints

Example cURL request:
```bash
curl -X GET http://localhost:3000/api/products?page=1&limit=10
```

---

## Future Enhancements

1. **Authentication**: JWT or session-based auth
2. **Role-based Access Control**: Admin, manager, viewer roles
3. **Audit Logging**: Comprehensive audit trail
4. **API Caching**: Redis caching for frequently accessed data
5. **Webhook Support**: Real-time notifications
6. **Multi-warehouse Support**: Inventory across multiple locations
7. **Advanced Reporting**: Analytics and business intelligence
8. **Bulk Import/Export**: CSV/Excel file processing
9. **Image Processing**: Automatic image optimization
10. **Search Engine**: Elasticsearch integration

---

## Support

For questions or issues, please refer to the project documentation or contact the development team.