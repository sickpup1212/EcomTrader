/**
 * Database Seed Script
 * Pipeline Rivers - Populate database with sample data
 * 
 * Run with: npm run seed
 */

const { db, initializeSchema } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

console.log('🌊 Starting database seed...\n');

// Initialize schema first
initializeSchema();

// Clear existing data
db.serialize(() => {
  console.log('Clearing existing data...');
  db.run(`DELETE FROM product_specifications`);
  db.run(`DELETE FROM product_features`);
  db.run(`DELETE FROM product_variants`);
  db.run(`DELETE FROM product_images`);
  db.run(`DELETE FROM reviews`);
  db.run(`DELETE FROM cart_items`);
  db.run(`DELETE FROM wishlist_items`);
  db.run(`DELETE FROM products`);
  db.run(`DELETE FROM categories`);

  // Seed Categories
  console.log('Seeding categories...');
  const categories = [
    { id: 'cat_electronics', name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
    { id: 'cat_clothing', name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
    { id: 'cat_home', name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
    { id: 'cat_sports', name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports equipment and outdoor gear' },
    { id: 'cat_books', name: 'Books', slug: 'books', description: 'Books and reading materials' }
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description)
    VALUES (?, ?, ?, ?)
  `);

  categories.forEach(cat => {
    insertCategory.run(cat.id, cat.name, cat.slug, cat.description);
  });
  insertCategory.finalize();

  console.log(`✓ Seeded ${categories.length} categories`);
});

// Seed Products
console.log('Seeding products...');

const products = [
  {
    id: 'prod_headphones_001',
    sku: 'WH-2024-001',
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'Experience premium sound quality with our flagship wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort for all-day listening. Perfect for music lovers, travelers, and professionals.',
    shortDescription: 'Premium wireless headphones with ANC and 30-hour battery',
    categoryId: 'cat_electronics',
    price: 299.00,
    originalPrice: 399.00,
    discountPercentage: 25,
    discountAmount: 100.00,
    stock: 156,
    stockStatus: 'in_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.5,
    ratingCount: 128,
    isActive: 1,
    isFeatured: 1,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', alt: 'Premium Wireless Headphones - Main View', order: 0 },
      { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', alt: 'Premium Wireless Headphones - Side View', order: 1 },
      { url: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800', alt: 'Premium Wireless Headphones - Detail', order: 2 }
    ],
    variants: [
      { type: 'color', name: 'Midnight Black', value: 'black', metadata: { hex: '#1a1a1a' } },
      { type: 'color', name: 'Silver', value: 'silver', metadata: { hex: '#c0c0c0' } }
    ],
    features: [
      { icon: 'battery', title: '30-Hour Battery', description: 'All-day listening on a single charge' },
      { icon: 'noise-cancel', title: 'Active Noise Cancellation', description: 'Block out distractions' },
      { icon: 'bluetooth', title: 'Bluetooth 5.0', description: 'Stable wireless connection' }
    ],
    specifications: {
      'Driver Size': '40mm',
      'Frequency Response': '20Hz - 20kHz',
      'Battery Life': '30 hours (ANC on)',
      'Charging Time': '2 hours',
      'Weight': '250g',
      'Bluetooth Version': '5.0'
    }
  },
  {
    id: 'prod_laptop_001',
    sku: 'LP-2024-001',
    name: 'UltraBook Pro 15',
    slug: 'ultrabook-pro-15',
    description: 'Powerful and portable laptop designed for professionals. Features the latest processor, stunning display, and all-day battery life. Perfect for creative work, programming, and business tasks.',
    shortDescription: 'Professional laptop with powerful performance',
    categoryId: 'cat_electronics',
    price: 1299.00,
    originalPrice: null,
    discountPercentage: null,
    discountAmount: null,
    stock: 45,
    stockStatus: 'in_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.8,
    ratingCount: 89,
    isActive: 1,
    isFeatured: 1,
    images: [
      { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', alt: 'UltraBook Pro 15 - Main View', order: 0 },
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', alt: 'UltraBook Pro 15 - Open View', order: 1 }
    ],
    variants: [
      { type: 'color', name: 'Space Gray', value: 'gray', metadata: { hex: '#4a4a4a' } },
      { type: 'color', name: 'Silver', value: 'silver', metadata: { hex: '#c0c0c0' } }
    ],
    features: [
      { icon: 'cpu', title: 'Latest Processor', description: 'Blazing fast performance' },
      { icon: 'display', title: '15" Retina Display', description: 'Stunning visuals' },
      { icon: 'battery', title: '12-Hour Battery', description: 'All-day productivity' }
    ],
    specifications: {
      'Processor': 'Intel Core i7 11th Gen',
      'RAM': '16GB DDR4',
      'Storage': '512GB SSD',
      'Display': '15.6" FHD (1920x1080)',
      'Graphics': 'Intel Iris Xe',
      'Weight': '1.8kg'
    }
  },
  {
    id: 'prod_watch_001',
    sku: 'SW-2024-001',
    name: 'SmartWatch Pro',
    slug: 'smartwatch-pro',
    description: 'Stay connected and track your fitness with our advanced smartwatch. Features heart rate monitoring, GPS, water resistance, and seamless smartphone integration.',
    shortDescription: 'Advanced smartwatch with fitness tracking',
    categoryId: 'cat_electronics',
    price: 399.00,
    originalPrice: 499.00,
    discountPercentage: 20,
    discountAmount: 100.00,
    stock: 89,
    stockStatus: 'in_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.3,
    ratingCount: 156,
    isActive: 1,
    isFeatured: 0,
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', alt: 'SmartWatch Pro - Main View', order: 0 },
      { url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800', alt: 'SmartWatch Pro - Side View', order: 1 }
    ],
    variants: [
      { type: 'color', name: 'Black', value: 'black', metadata: { hex: '#000000' } },
      { type: 'color', name: 'Rose Gold', value: 'rose-gold', metadata: { hex: '#b76e79' } }
    ],
    features: [
      { icon: 'heart', title: 'Heart Rate Monitor', description: '24/7 health tracking' },
      { icon: 'gps', title: 'Built-in GPS', description: 'Track your routes' },
      { icon: 'water', title: 'Water Resistant', description: '50m water resistance' }
    ],
    specifications: {
      'Display': '1.4" AMOLED',
      'Battery Life': '7 days',
      'Water Resistance': '5 ATM (50m)',
      'Sensors': 'Heart rate, GPS, Accelerometer',
      'Compatibility': 'iOS & Android',
      'Weight': '45g'
    }
  },
  {
    id: 'prod_camera_001',
    sku: 'CM-2024-001',
    name: 'Professional DSLR Camera',
    slug: 'professional-dslr-camera',
    description: 'Capture stunning photos and videos with our professional-grade DSLR camera. Features high-resolution sensor, fast autofocus, and 4K video recording.',
    shortDescription: 'Professional camera for photography enthusiasts',
    categoryId: 'cat_electronics',
    price: 1899.00,
    originalPrice: null,
    discountPercentage: null,
    discountAmount: null,
    stock: 23,
    stockStatus: 'in_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.9,
    ratingCount: 67,
    isActive: 1,
    isFeatured: 1,
    images: [
      { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800', alt: 'Professional DSLR Camera - Main View', order: 0 }
    ],
    variants: [],
    features: [
      { icon: 'camera', title: '24MP Sensor', description: 'High-resolution images' },
      { icon: 'video', title: '4K Video', description: 'Professional video recording' },
      { icon: 'focus', title: 'Fast Autofocus', description: 'Never miss a moment' }
    ],
    specifications: {
      'Sensor': '24.2MP APS-C CMOS',
      'ISO Range': '100-25600',
      'Video': '4K @ 30fps',
      'Autofocus Points': '45',
      'Screen': '3.2" Touchscreen LCD',
      'Weight': '675g (body only)'
    }
  },
  {
    id: 'prod_tshirt_001',
    sku: 'TS-2024-001',
    name: 'Premium Cotton T-Shirt',
    slug: 'premium-cotton-tshirt',
    description: 'Comfortable and stylish t-shirt made from 100% organic cotton. Perfect for everyday wear with a modern fit and sustainable materials.',
    shortDescription: 'Comfortable organic cotton t-shirt',
    categoryId: 'cat_clothing',
    price: 29.99,
    originalPrice: null,
    discountPercentage: null,
    discountAmount: null,
    stock: 234,
    stockStatus: 'in_stock',
    lowStockThreshold: 50,
    ratingAverage: 4.6,
    ratingCount: 342,
    isActive: 1,
    isFeatured: 0,
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', alt: 'Premium Cotton T-Shirt - Main View', order: 0 }
    ],
    variants: [
      { type: 'size', name: 'Small', value: 'S', metadata: {} },
      { type: 'size', name: 'Medium', value: 'M', metadata: {} },
      { type: 'size', name: 'Large', value: 'L', metadata: {} },
      { type: 'size', name: 'X-Large', value: 'XL', metadata: {} },
      { type: 'color', name: 'White', value: 'white', metadata: { hex: '#ffffff' } },
      { type: 'color', name: 'Black', value: 'black', metadata: { hex: '#000000' } },
      { type: 'color', name: 'Navy', value: 'navy', metadata: { hex: '#001f3f' } }
    ],
    features: [
      { icon: 'leaf', title: 'Organic Cotton', description: '100% sustainable materials' },
      { icon: 'shirt', title: 'Modern Fit', description: 'Comfortable and stylish' },
      { icon: 'wash', title: 'Easy Care', description: 'Machine washable' }
    ],
    specifications: {
      'Material': '100% Organic Cotton',
      'Fit': 'Modern Regular Fit',
      'Care': 'Machine wash cold',
      'Origin': 'Made in USA',
      'Weight': '180 GSM'
    }
  },
  {
    id: 'prod_backpack_001',
    sku: 'BP-2024-001',
    name: 'Travel Backpack Pro',
    slug: 'travel-backpack-pro',
    description: 'Durable and spacious backpack designed for travelers and commuters. Features multiple compartments, laptop sleeve, and water-resistant material.',
    shortDescription: 'Versatile backpack for travel and daily use',
    categoryId: 'cat_sports',
    price: 89.99,
    originalPrice: 119.99,
    discountPercentage: 25,
    discountAmount: 30.00,
    stock: 67,
    stockStatus: 'in_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.7,
    ratingCount: 234,
    isActive: 1,
    isFeatured: 0,
    images: [
      { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', alt: 'Travel Backpack Pro - Main View', order: 0 }
    ],
    variants: [
      { type: 'color', name: 'Black', value: 'black', metadata: { hex: '#000000' } },
      { type: 'color', name: 'Gray', value: 'gray', metadata: { hex: '#808080' } },
      { type: 'color', name: 'Navy', value: 'navy', metadata: { hex: '#001f3f' } }
    ],
    features: [
      { icon: 'laptop', title: 'Laptop Compartment', description: 'Fits up to 17" laptop' },
      { icon: 'water', title: 'Water Resistant', description: 'Protects your belongings' },
      { icon: 'usb', title: 'USB Charging Port', description: 'Charge on the go' }
    ],
    specifications: {
      'Capacity': '35L',
      'Laptop Compartment': 'Up to 17"',
      'Material': 'Water-resistant polyester',
      'Dimensions': '50 x 32 x 20 cm',
      'Weight': '1.2kg'
    }
  },
  {
    id: 'prod_book_001',
    sku: 'BK-2024-001',
    name: 'The Art of Programming',
    slug: 'art-of-programming',
    description: 'Comprehensive guide to modern programming practices. Learn algorithms, data structures, and best practices from industry experts.',
    shortDescription: 'Essential programming guide for developers',
    categoryId: 'cat_books',
    price: 49.99,
    originalPrice: null,
    discountPercentage: null,
    discountAmount: null,
    stock: 145,
    stockStatus: 'in_stock',
    lowStockThreshold: 30,
    ratingAverage: 4.8,
    ratingCount: 567,
    isActive: 1,
    isFeatured: 1,
    images: [
      { url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800', alt: 'The Art of Programming - Cover', order: 0 }
    ],
    variants: [
      { type: 'format', name: 'Hardcover', value: 'hardcover', metadata: {} },
      { type: 'format', name: 'Paperback', value: 'paperback', metadata: {} },
      { type: 'format', name: 'eBook', value: 'ebook', metadata: {} }
    ],
    features: [
      { icon: 'book', title: '800+ Pages', description: 'Comprehensive coverage' },
      { icon: 'code', title: 'Code Examples', description: 'Practical implementations' },
      { icon: 'star', title: 'Expert Authors', description: 'Industry professionals' }
    ],
    specifications: {
      'Pages': '856',
      'Publisher': 'Tech Press',
      'Edition': '3rd Edition',
      'Language': 'English',
      'ISBN': '978-1234567890'
    }
  },
  {
    id: 'prod_desk_001',
    sku: 'DK-2024-001',
    name: 'Standing Desk Pro',
    slug: 'standing-desk-pro',
    description: 'Ergonomic standing desk with electric height adjustment. Improve your posture and productivity with this premium workspace solution.',
    shortDescription: 'Electric standing desk for healthy workspace',
    categoryId: 'cat_home',
    price: 599.00,
    originalPrice: 799.00,
    discountPercentage: 25,
    discountAmount: 200.00,
    stock: 18,
    stockStatus: 'low_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.6,
    ratingCount: 123,
    isActive: 1,
    isFeatured: 0,
    images: [
      { url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800', alt: 'Standing Desk Pro - Main View', order: 0 }
    ],
    variants: [
      { type: 'color', name: 'Black', value: 'black', metadata: { hex: '#000000' } },
      { type: 'color', name: 'White', value: 'white', metadata: { hex: '#ffffff' } },
      { type: 'size', name: '48" Wide', value: '48', metadata: {} },
      { type: 'size', name: '60" Wide', value: '60', metadata: {} }
    ],
    features: [
      { icon: 'height', title: 'Electric Adjustment', description: 'Smooth height control' },
      { icon: 'memory', title: 'Memory Presets', description: 'Save favorite heights' },
      { icon: 'strong', title: 'Sturdy Build', description: 'Supports up to 150kg' }
    ],
    specifications: {
      'Height Range': '72-122 cm',
      'Desktop Size': '120 x 60 cm',
      'Weight Capacity': '150 kg',
      'Motor': 'Dual motor system',
      'Material': 'Steel frame, laminated top'
    }
  },
  {
    id: 'prod_yoga_001',
    sku: 'YM-2024-001',
    name: 'Premium Yoga Mat',
    slug: 'premium-yoga-mat',
    description: 'Non-slip yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and fitness exercises with superior cushioning and grip.',
    shortDescription: 'Eco-friendly yoga mat with superior grip',
    categoryId: 'cat_sports',
    price: 39.99,
    originalPrice: null,
    discountPercentage: null,
    discountAmount: null,
    stock: 0,
    stockStatus: 'out_of_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.5,
    ratingCount: 289,
    isActive: 1,
    isFeatured: 0,
    images: [
      { url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800', alt: 'Premium Yoga Mat - Main View', order: 0 }
    ],
    variants: [
      { type: 'color', name: 'Purple', value: 'purple', metadata: { hex: '#800080' } },
      { type: 'color', name: 'Blue', value: 'blue', metadata: { hex: '#0000ff' } },
      { type: 'color', name: 'Pink', value: 'pink', metadata: { hex: '#ffc0cb' } }
    ],
    features: [
      { icon: 'leaf', title: 'Eco-Friendly', description: 'Made from TPE material' },
      { icon: 'grip', title: 'Non-Slip Surface', description: 'Superior grip' },
      { icon: 'cushion', title: 'Extra Cushioning', description: '6mm thickness' }
    ],
    specifications: {
      'Material': 'TPE (Thermoplastic Elastomer)',
      'Thickness': '6mm',
      'Dimensions': '183 x 61 cm',
      'Weight': '1kg',
      'Care': 'Wipe clean with damp cloth'
    }
  },
  {
    id: 'prod_coffee_001',
    sku: 'CF-2024-001',
    name: 'Smart Coffee Maker',
    slug: 'smart-coffee-maker',
    description: 'Programmable coffee maker with smartphone app control. Wake up to freshly brewed coffee with customizable strength and temperature settings.',
    shortDescription: 'App-controlled coffee maker for perfect brew',
    categoryId: 'cat_home',
    price: 149.99,
    originalPrice: null,
    discountPercentage: null,
    discountAmount: null,
    stock: 56,
    stockStatus: 'in_stock',
    lowStockThreshold: 20,
    ratingAverage: 4.4,
    ratingCount: 178,
    isActive: 1,
    isFeatured: 0,
    images: [
      { url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800', alt: 'Smart Coffee Maker - Main View', order: 0 }
    ],
    variants: [],
    features: [
      { icon: 'phone', title: 'App Control', description: 'Control from your smartphone' },
      { icon: 'timer', title: 'Programmable', description: 'Schedule your brew' },
      { icon: 'temp', title: 'Temperature Control', description: 'Perfect brewing temp' }
    ],
    specifications: {
      'Capacity': '12 cups',
      'Power': '1000W',
      'Features': 'App control, timer, auto-shutoff',
      'Compatibility': 'iOS & Android',
      'Dimensions': '35 x 20 x 30 cm'
    }
  }
];

db.serialize(() => {
  // Prepare insert statements
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, sku, name, slug, description, short_description, category_id,
      price_amount, price_currency, price_original_amount, discount_percentage, discount_amount,
      stock_quantity, stock_status, stock_low_threshold,
      rating_average, rating_count, is_active, is_featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (id, product_id, url, alt, display_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, type, name, value, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertFeature = db.prepare(`
    INSERT INTO product_features (id, product_id, icon, title, description, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSpec = db.prepare(`
    INSERT INTO product_specifications (id, product_id, spec_key, spec_value)
    VALUES (?, ?, ?, ?)
  `);

  // Insert products with all related data
  products.forEach(product => {
    // Insert product
    insertProduct.run(
      product.id,
      product.sku,
      product.name,
      product.slug,
      product.description,
      product.shortDescription,
      product.categoryId,
      product.price,
      'USD',
      product.originalPrice,
      product.discountPercentage,
      product.discountAmount,
      product.stock,
      product.stockStatus,
      product.lowStockThreshold,
      product.ratingAverage,
      product.ratingCount,
      product.isActive,
      product.isFeatured
    );

    // Insert images
    product.images.forEach(img => {
      insertImage.run(uuidv4(), product.id, img.url, img.alt, img.order);
    });

    // Insert variants
    product.variants.forEach(variant => {
      insertVariant.run(
        uuidv4(),
        product.id,
        variant.type,
        variant.name,
        variant.value,
        JSON.stringify(variant.metadata)
      );
    });

    // Insert features
    product.features.forEach((feature, index) => {
      insertFeature.run(
        uuidv4(),
        product.id,
        feature.icon,
        feature.title,
        feature.description,
        index
      );
    });

    // Insert specifications
    Object.entries(product.specifications).forEach(([key, value]) => {
      insertSpec.run(uuidv4(), product.id, key, value);
    });
  });

  insertProduct.finalize();
  insertImage.finalize();
  insertVariant.finalize();
  insertFeature.finalize();
  insertSpec.finalize();
});

console.log(`✓ Seeded ${products.length} products with all related data`);

// Seed Reviews
console.log('Seeding reviews...');

const reviews = [
  {
    productId: 'prod_headphones_001',
    authorName: 'Sarah M.',
    verified: 1,
    rating: 5,
    title: 'Amazing sound quality!',
    content: 'Absolutely love these headphones. The noise cancellation is incredible and the battery lasts forever. Worth every penny!',
    helpful: 24
  },
  {
    productId: 'prod_headphones_001',
    authorName: 'John D.',
    verified: 1,
    rating: 4,
    title: 'Great headphones, minor issues',
    content: 'Sound quality is excellent, but they can feel a bit tight after long sessions. Overall very happy with the purchase.',
    helpful: 12
  },
  {
    productId: 'prod_laptop_001',
    authorName: 'Emily R.',
    verified: 1,
    rating: 5,
    title: 'Perfect for developers',
    content: 'This laptop handles everything I throw at it. Compiling large projects is a breeze and the display is gorgeous.',
    helpful: 45
  },
  {
    productId: 'prod_watch_001',
    authorName: 'Mike T.',
    verified: 0,
    rating: 4,
    title: 'Good fitness tracker',
    content: 'Tracks my workouts accurately and the battery life is impressive. The app could use some improvements though.',
    helpful: 8
  },
  {
    productId: 'prod_book_001',
    authorName: 'Alex K.',
    verified: 1,
    rating: 5,
    title: 'Must-read for programmers',
    content: 'This book completely changed how I approach coding. The examples are clear and the explanations are thorough.',
    helpful: 67
  }
];

db.serialize(() => {
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, product_id, author_name, author_verified, rating, title, content, helpful_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  reviews.forEach(review => {
    insertReview.run(
      uuidv4(),
      review.productId,
      review.authorName,
      review.verified,
      review.rating,
      review.title,
      review.content,
      review.helpful
    );
  });

  insertReview.finalize((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(`✓ Seeded ${reviews.length} reviews`);

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  • 5 categories`);
    console.log(`  • 10 products`);
    console.log(`  • 5 reviews`);
    console.log(`  • Product images, variants, features, and specifications\n`);

    db.close();
  });
});
