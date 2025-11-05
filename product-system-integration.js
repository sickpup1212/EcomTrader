/**
 * Frontend-Backend Integration Script
 * Connects existing frontend components with new backend APIs
 */

class ProductSystemIntegration {
    constructor() {
        this.apiBase = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : '/api';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize the product system
     */
    async initialize() {
        try {
            // Load categories for filters
            await this.loadCategories();

            // Load products for catalog
            await this.loadProducts();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize cart from existing system
            this.initializeCart();

            console.log('Product system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize product system:', error);
            this.showError('Unable to load products. Please refresh the page.');
        }
    }

    /**
     * Load categories from backend
     */
    async loadCategories() {
        try {
            const response = await this.request('/products/categories');

            // Handle different response structures
            let categories = response.data;

            // If response.data contains a categories property, use that
            if (categories && typeof categories === 'object' && categories.categories) {
                categories = categories.categories;
            }

            // Update category filter dropdown
            const categoryFilter = document.querySelector('.filter-select[aria-label="Category filter"]');
            if (categoryFilter) {
                // Clear existing dynamic options
                Array.from(categoryFilter.options).forEach(option => {
                    if (option.value) { // Keep "All Categories" which has no value
                        option.remove();
                    }
                });

                if (Array.isArray(categories)) {
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        const categoryName = String(category.name || 'Unknown Category');
                        const productCount = String(category.product_count || 0);
                        option.value = category.id;
                        option.textContent = `${categoryName} (${productCount})`;
                        categoryFilter.appendChild(option);
                    });
                } else {
                    console.warn('Categories is not an array:', categories);
                }
            }

            this.cache.set('categories', categories);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    /**
     * Load products from backend
     */
    async loadProducts(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await this.request(`/products?${queryString}`);

            // The API returns data in response.data.products
            let products = response.data?.products || [];

            console.log('Loaded products:', products); // Debug log

            // Update product grid
            this.updateProductGrid(products);

            this.cache.set(`products_${queryString}`, products);
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('Failed to load products');
        }
    }

    /**
     * Update product grid with new products
     */
    updateProductGrid(products) {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) {
            console.warn('Product grid container not found');
            return;
        }

        // Clear existing products
        productGrid.innerHTML = '';

        if (!Array.isArray(products)) {
            console.warn('Products data is not an array:', products);
            productGrid.innerHTML = '<div class="no-results">No products available</div>';
            return;
        }

        if (products.length === 0) {
            productGrid.innerHTML = '<div class="no-results">No products found</div>';
            return;
        }

        products.forEach((product, index) => {
            console.log(`Creating product card ${index + 1}:`, product); // Debug log
            try {
                const productCard = this.createProductCard(product);
                if (productCard) {
                    productGrid.appendChild(productCard);
                } else {
                    console.warn('Failed to create product card for:', product);
                }
            } catch (error) {
                console.error('Error creating product card:', error, product);
            }
        });
    }

    /**
     * Create product card from product data
     */
    createProductCard(product) {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.dataset.productId = product.id;

        // Helper function to safely get property values
        const safeGet = (obj, key, defaultValue = '') => {
            if (!obj || typeof obj !== 'object') return defaultValue;
            return obj[key] !== undefined && obj[key] !== null ? String(obj[key]) : defaultValue;
        };

        // Extract and sanitize product data based on backend API structure
        const productId = safeGet(product, 'id', '');
        const productName = safeGet(product, 'name', 'Product Name');

        // Handle category name from nested category object
        const categoryName = product.category && product.category.name
            ? String(product.category.name)
            : safeGet(product, 'category_name', 'Uncategorized');

        const shortDescription = safeGet(product, 'shortDescription', '');
        const longDescription = safeGet(product, 'description', '');

        // Handle price from nested price object
        let price = '0';
        let originalPrice = '0';
        if (product.price && typeof product.price === 'object') {
            price = String(product.price.amount || '0');
            originalPrice = String(product.price.originalAmount || '0');
        } else {
            // Fallback for flat price structure
            price = safeGet(product, 'price', '0');
            originalPrice = safeGet(product, 'original_price', '0');
        }

        // Handle stock status from nested stock object
        const stockStatus = (product.stock && product.stock.status)
            ? String(product.stock.status)
            : safeGet(product, 'stock_status', 'in_stock');

        // Handle featured status from metadata
        const isFeatured = product.metadata && product.metadata.isFeatured === true ||
                          product.is_featured === true ||
                          product.is_featured === 1;

        // Handle rating from nested rating object
        let averageRating = 0;
        let reviewCount = 0;
        if (product.rating && typeof product.rating === 'object') {
            averageRating = parseFloat(product.rating.average) || 0;
            reviewCount = parseInt(product.rating.count) || 0;
        } else {
            // Fallback for flat rating structure
            averageRating = parseFloat(safeGet(product, 'average_rating', '0')) || 0;
            reviewCount = parseInt(safeGet(product, 'review_count', '0')) || 0;
        }

        // Calculate discount percentage
        const discountPercentage = originalPrice && parseFloat(originalPrice) > parseFloat(price)
            ? Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)
            : 0;

        // Generate badge HTML
        let badgesHTML = '';
        if (isFeatured) badgesHTML += '<span class="product-card__badge">Featured</span>';
        if (discountPercentage > 0) badgesHTML += `<span class="product-card__badge product-card__badge--sale">${discountPercentage}% OFF</span>`;
        if (stockStatus === 'low_stock') badgesHTML += '<span class="product-card__badge" style="background: var(--color-warning-500);">Low Stock</span>';

        // Generate rating stars
        const fullStars = Math.floor(averageRating);
        const hasHalfStar = averageRating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '★';
        if (hasHalfStar) starsHTML += '☆';
        for (let i = 0; i < emptyStars; i++) starsHTML += '☆';

        // Generate price HTML
        let priceHTML = `<span class="product-card__price-current">$${parseFloat(price).toFixed(2)}</span>`;
        if (originalPrice && parseFloat(originalPrice) > parseFloat(price)) {
            priceHTML += `<span class="product-card__price-original">$${parseFloat(originalPrice).toFixed(2)}</span>`;
        }

        // Handle image data
        let imageHTML = '';
        try {
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const firstImage = product.images[0];
                const imageUrl = firstImage.url || firstImage.src || '';
                if (imageUrl && typeof imageUrl === 'string') {
                    imageHTML = `<img src="${imageUrl}" alt="${firstImage.alt || productName}" loading="lazy">`;
                }
            }
        } catch (error) {
            console.warn('Error handling product images:', error);
            imageHTML = '';
        }

        if (!imageHTML) {
            imageHTML = `<svg class="placeholder-icon" viewBox="0 0 80 80" fill="none">
                <rect x="10" y="20" width="60" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
                <circle cx="30" cy="35" r="5" stroke="currentColor" stroke-width="2"/>
                <path d="M10 50L25 35L35 45L55 25L70 40V60H10V50Z" fill="currentColor" opacity="0.2"/>
            </svg>`;
        }

        // Handle description text
        let descriptionText = shortDescription || '';
        if (!descriptionText && longDescription) {
            descriptionText = this.truncateText(String(longDescription), 100);
        } else if (!descriptionText) {
            descriptionText = 'No description available';
        }

        card.innerHTML = `
            <div class="product-card__image">
                ${imageHTML}
                ${badgesHTML}
            </div>
            <div class="product-card__content">
                <div class="product-card__category">${categoryName}</div>
                <h2 class="product-card__title">${productName}</h2>
                <p class="product-card__description">${descriptionText}</p>
                <div class="product-card__footer">
                    <div class="product-card__price">
                        ${priceHTML}
                    </div>
                    <div class="product-card__rating">
                        <span class="product-card__stars">${starsHTML}</span>
                        <span>(${reviewCount})</span>
                    </div>
                </div>
                <div class="product-card__actions">
                    <button class="btn btn--primary add-to-cart-btn" data-product-id="${productId}" ${stockStatus === 'out_of_stock' ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 2H4L5 10H13L15 4H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <a href="product-display.html?id=${productId}" class="btn btn--secondary" title="View details">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                    </a>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Add product to cart
     */
    async addToCart(productId, quantity = 1) {
        try {
            // Get product details
            const product = await this.getProduct(productId);

            // Add to existing cart system
            if (window.cart) {
                window.cart.add(productId, quantity);
            } else {
                console.error('Cart not initialized');
            }

            this.showSuccess(`${product.name} added to cart!`);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            this.showError('Failed to add item to cart');
        }
    }

    /**
     * Get single product
     */
    async getProduct(productId) {
        // Check cache first
        if (this.cache.has(`product_${productId}`)) {
            return this.cache.get(`product_${productId}`);
        }

        const response = await this.request(`/products/${productId}`);
        this.cache.set(`product_${productId}`, response.data);
        return response.data;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }

        // Filter functionality
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.handleFilters();
            });
        });

        // Add event delegation for dynamically created add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn[data-product-id]')) {
                const button = e.target.closest('.add-to-cart-btn[data-product-id]');
                const productId = button.dataset.productId;

                // Prevent clicking disabled buttons
                if (button.disabled) {
                    e.preventDefault();
                    return;
                }

                this.addToCart(productId);
            }
        });
    }

    /**
     * Handle search
     */
    async handleSearch(searchTerm) {
        const filters = this.getCurrentFilters();
        if (searchTerm) {
            filters.search = searchTerm;
        }
        await this.loadProducts(filters);
    }

    /**
     * Handle filters
     */
    async handleFilters() {
        const filters = this.getCurrentFilters();
        await this.loadProducts(filters);
    }

    /**
     * Get current filter values
     */
    getCurrentFilters() {
        const filters = {};

        // Category filter
        const categoryFilter = document.querySelector('.filter-select[aria-label="Category filter"]');
        if (categoryFilter && categoryFilter.value) {
            filters.category = categoryFilter.value;
        }

        // Price filter
        const priceFilter = document.querySelector('.filter-select[aria-label="Price range filter"]');
        if (priceFilter && priceFilter.value) {
            const [minPrice, maxPrice] = priceFilter.value.split('-');
            if (minPrice) filters.minPrice = minPrice;
            if (maxPrice) filters.maxPrice = maxPrice;
        }

        // Sort filter
        const sortFilter = document.querySelector('.filter-select[aria-label="Sort by"]');
        if (sortFilter && sortFilter.value) {
            const [sort, order] = sortFilter.value.split('-');
            filters.sort = sort;
            filters.order = order;
        }

        return filters;
    }

    /**
     * Initialize cart integration
     */
    initializeCart() {
        // Update cart badge if cart exists
        if (window.cart) {
            window.cart.load().then(() => {
                this.updateCartBadge();
            });
        }
    }

    /**
     * Update cart badge
     */
    updateCartBadge() {
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Truncate text to specified length
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.Voltage && window.Voltage.toast) {
            window.Voltage.toast.show(message, 'success');
        } else {
            this.showNotification(message, 'success');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (window.Voltage && window.Voltage.toast) {
            window.Voltage.toast.show(message, 'error');
        } else {
            this.showNotification(message, 'error');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'product-system-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the product system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productSystem = new ProductSystemIntegration();

    // Wait for existing systems to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.productSystem.initialize();
        });
    } else {
        window.productSystem.initialize();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductSystemIntegration;
}
