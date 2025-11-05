/**
 * Product Display Page Integration
 * Populates product-display.html with dynamic data from backend APIs
 */

class ProductDisplayIntegration {
    constructor() {
        this.apiBase = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : '/api';
        this.productId = this.getProductIdFromUrl();
        this.product = null;
    }

    /**
     * Initialize product display page
     */
    async initialize() {
        if (!this.productId) {
            this.showError('No product ID specified');
            return;
        }

        try {
            // Load product data
            await this.loadProduct();

            // Load product reviews
            await this.loadProductReviews();

            // Load related products
            await this.loadRelatedProducts();

            // Setup interactions
            this.setupInteractions();

            console.log('Product display initialized successfully');
        } catch (error) {
            console.error('Failed to initialize product display:', error);
            this.showError('Unable to load product. Please try again later.');
        }
    }

    /**
     * Get product ID from URL parameters
     */
    getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Load product data from backend
     */
    async loadProduct() {
        try {
            const response = await this.request(`/products/${this.productId}`);
            this.product = response.product;
            this.updateProductDisplay();
        } catch (error) {
            console.error('Failed to load product:', error);
            throw error;
        }
    }

    /**
     * Update product display with loaded data
     */
    updateProductDisplay() {
        // Update page title
        document.title = `${this.product.name} - Trader`;

        // Update breadcrumb
        this.updateBreadcrumb();

        // Update product gallery
        this.updateGallery();

        // Update product info
        this.updateProductInfo();

        // Update price
        this.updatePrice();

        // Update product options (colors, sizes)
        this.updateProductOptions();

        // Update product details tabs
        this.updateProductDetails();
    }

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb() {
        const breadcrumbCurrent = document.querySelector('.breadcrumb__current');
        if (breadcrumbCurrent) {
            breadcrumbCurrent.textContent = this.product.name;
        }

        // Update category link if available
        const categoryLink = document.querySelector('.breadcrumb__link[href="catalog.html"]');
        if (categoryLink && this.product.category_name) {
            categoryLink.textContent = this.product.category_name;
        }
    }

    /**
     * Update product gallery
     */
    updateGallery() {
        const mainImage = document.querySelector('#current-image');
        const thumbnails = document.querySelector('#thumbnails');

        if (mainImage && this.product.images && this.product.images.length > 0) {
            mainImage.src = this.product.images[0].url;
            mainImage.alt = this.product.name;

            // Update thumbnails
            if (thumbnails) {
                thumbnails.innerHTML = '';
                this.product.images.forEach((image, index) => {
                    const thumbnail = document.createElement('button');
                    thumbnail.className = `gallery__thumbnail ${index === 0 ? 'gallery__thumbnail--active' : ''}`;
                    thumbnail.dataset.image = image.url;
                    thumbnail.innerHTML = `<img src="${image.url}" alt="View ${index + 1}">`;
                    thumbnails.appendChild(thumbnail);
                });
            }
        }
    }

    /**
     * Update product information
     */
    updateProductInfo() {
        // Update title
        const titleElement = document.querySelector('.product__title');
        if (titleElement) {
            titleElement.textContent = this.product.name;
        }

        // Update description
        const descriptionElement = document.querySelector('.product__description');
        if (descriptionElement) {
            descriptionElement.textContent = this.product.description || '';
        }

        // Update rating
        this.updateRating();

        // Update badges
        this.updateBadges();
    }

    /**
     * Update product rating
     */
    updateRating() {
        const ratingContainer = document.querySelector('#product-rating');
        const reviewCountElement = document.querySelector('.product__review-count');

        if (ratingContainer) {
            const fullStars = Math.floor(this.product.average_rating);
            const hasHalfStar = this.product.average_rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

            let starsHTML = '';
            for (let i = 0; i < fullStars; i++) {
                starsHTML += '<svg class="rating__star rating__star--filled" width="20" height="20" viewBox="0 0 20 20"><path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor"/></svg>';
            }
            if (hasHalfStar) {
                starsHTML += '<svg class="rating__star rating__star--half" width="20" height="20" viewBox="0 0 20 20"><path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor" opacity="0.3"/></svg>';
            }
            for (let i = 0; i < emptyStars; i++) {
                starsHTML += '<svg class="rating__star" width="20" height="20" viewBox="0 0 20 20"><path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor" opacity="0.3"/></svg>';
            }

            ratingContainer.innerHTML = starsHTML;
        }

        if (reviewCountElement) {
            reviewCountElement.textContent = `${this.product.average_rating.toFixed(1)} (${this.product.review_count} reviews)`;
        }
    }

    /**
     * Update product badges
     */
    updateBadges() {
        const badgesContainer = document.querySelector('.product__badges');
        if (!badgesContainer) return;

        let badgesHTML = '';

        // Stock status badge
        if (this.product.stock_status === 'in_stock') {
            badgesHTML += '<span class="badge badge--success">In Stock</span>';
        } else if (this.product.stock_status === 'low_stock') {
            badgesHTML += '<span class="badge badge--warning">Low Stock</span>';
        } else if (this.product.stock_status === 'out_of_stock') {
            badgesHTML += '<span class="badge badge--error">Out of Stock</span>';
        }

        // Featured badge
        if (this.product.is_featured) {
            badgesHTML += '<span class="badge badge--accent">Featured</span>';
        }

        // Sale badge
        if (this.product.original_price && this.product.original_price > this.product.price) {
            const discount = Math.round(((this.product.original_price - this.product.price) / this.product.original_price) * 100);
            badgesHTML += `<span class="badge badge--sale">${discount}% OFF</span>`;
        }

        badgesContainer.innerHTML = badgesHTML;
    }

    /**
     * Update price display
     */
    updatePrice() {
        const currentPriceElement = document.querySelector('.price__current');
        const originalPriceElement = document.querySelector('.price__original');
        const savingsElement = document.querySelector('.product__savings');

        if (currentPriceElement) {
            currentPriceElement.textContent = `$${this.product.price}`;
        }

        if (originalPriceElement && this.product.original_price && this.product.original_price > this.product.price) {
            originalPriceElement.textContent = `$${this.product.original_price}`;
            originalPriceElement.style.display = 'block';
        }

        if (savingsElement && this.product.original_price && this.product.original_price > this.product.price) {
            const savings = Math.round(((this.product.original_price - this.product.price) / this.product.original_price) * 100);
            savingsElement.textContent = `Save ${savings}%`;
        }
    }

    /**
     * Update product options (colors, sizes)
     */
    updateProductOptions() {
        this.updateColorOptions();
        this.updateSizeOptions();
    }

    /**
     * Update color options
     */
    updateColorOptions() {
        const colorSelector = document.querySelector('#color-options');
        if (!colorSelector || !this.product.colors || this.product.colors.length === 0) return;

        colorSelector.innerHTML = '';
        this.product.colors.forEach((color, index) => {
            const colorButton = document.createElement('button');
            colorButton.className = `color-option ${index === 0 ? 'color-option--active' : ''}`;
            colorButton.style.backgroundColor = color.hex_code || '#000000';
            colorButton.dataset.color = color.name;
            colorButton.setAttribute('aria-label', color.name);
            colorSelector.appendChild(colorButton);
        });

        // Update selected color display
        const selectedColorElement = document.querySelector('#selected-color');
        if (selectedColorElement && this.product.colors.length > 0) {
            selectedColorElement.textContent = this.product.colors[0].name;
        }
    }

    /**
     * Update size options
     */
    updateSizeOptions() {
        // Check if size selector exists in the HTML
        const existingSizeOptions = document.querySelector('.size-selector');
        if (existingSizeOptions && this.product.sizes && this.product.sizes.length > 0) {
            // This would need to be implemented in the HTML first
            console.log('Size options available:', this.product.sizes);
        }
    }

    /**
     * Update product details tabs
     */
    updateProductDetails() {
        // Update details tab
        const detailsPanel = document.querySelector('#panel-details .content-section__text');
        if (detailsPanel && this.product.description) {
            detailsPanel.textContent = this.product.description;
        }

        // Update specifications tab
        this.updateSpecifications();

        // Update features section
        this.updateFeatures();
    }

    /**
     * Update specifications
     */
    updateSpecifications() {
        const specsList = document.querySelector('.spec-list');
        if (!specsList) return;

        // Create specifications from product attributes
        const specs = [
            { term: 'SKU', detail: this.product.sku || 'N/A' },
            { term: 'Weight', detail: this.product.weight ? `${this.product.weight} lbs` : 'N/A' },
            { term: 'Dimensions', detail: this.getDimensionsString() },
            { term: 'Category', detail: this.product.category_name || 'N/A' },
            { term: 'Stock Status', detail: this.formatStockStatus(this.product.stock_status) },
        ];

        // Add custom specifications if available
        if (this.product.specifications) {
            specs.push(...this.product.specifications);
        }

        specsList.innerHTML = specs.map(spec => `
            <div class="spec-list__item">
                <dt class="spec-list__term">${spec.term}</dt>
                <dd class="spec-list__detail">${spec.detail}</dd>
            </div>
        `).join('');
    }

    /**
     * Get dimensions string
     */
    getDimensionsString() {
        if (!this.product.length && !this.product.width && !this.product.height) {
            return 'N/A';
        }

        const dimensions = [];
        if (this.product.length) dimensions.push(`${this.product.length}"`);
        if (this.product.width) dimensions.push(`${this.product.width}"`);
        if (this.product.height) dimensions.push(`${this.product.height}"`);

        return dimensions.join(' x ');
    }

    /**
     * Format stock status
     */
    formatStockStatus(status) {
        const statusMap = {
            'in_stock': 'In Stock',
            'low_stock': 'Low Stock',
            'out_of_stock': 'Out of Stock',
            'discontinued': 'Discontinued'
        };
        return statusMap[status] || status;
    }

    /**
     * Update features section
     */
    updateFeatures() {
        // Features are currently static in the HTML, but could be made dynamic
        // based on product attributes in the future
    }

    /**
     * Load product reviews
     */
    async loadProductReviews() {
        try {
            const response = await this.request(`/products/${this.productId}/reviews`);
            this.updateReviews(response.data.reviews);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        }
    }

    /**
     * Update reviews display
     */
    updateReviews(reviews) {
        const reviewsContainer = document.querySelector('.reviews');
        if (!reviewsContainer) return;

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
            return;
        }

        reviewsContainer.innerHTML = reviews.map(review => `
            <article class="review">
                <div class="review__header">
                    <span class="review__author">${review.author_name}</span>
                    <div class="rating rating--small">
                        ${this.generateStarRating(review.rating)}
                    </div>
                </div>
                <p class="review__text">${review.comment}</p>
                <time class="review__date">${this.formatDate(review.created_at)}</time>
            </article>
        `).join('');
    }

    /**
     * Generate star rating HTML
     */
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<svg class="rating__star rating__star--filled" width="16" height="16" viewBox="0 0 20 20"><path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor"/></svg>';
        }
        if (hasHalfStar) {
            starsHTML += '<svg class="rating__star rating__star--half" width="16" height="16" viewBox="0 0 20 20"><path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor" opacity="0.3"/></svg>';
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<svg class="rating__star" width="16" height="16" viewBox="0 0 20 20"><path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor" opacity="0.3"/></svg>';
        }

        return starsHTML;
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Load related products
     */
    async loadRelatedProducts() {
        try {
            const response = await this.request(`/products/${this.productId}/related`);
            // Related products section would need to be added to HTML
            console.log('Related products:', response.data);
        } catch (error) {
            console.error('Failed to load related products:', error);
        }
    }

    /**
     * Setup product interactions
     */
    setupInteractions() {
        // Add to cart functionality
        const addToCartButton = document.querySelector('#add-to-cart');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', () => {
                this.addToCart();
            });
        }

        // Wishlist functionality
        const wishlistButton = document.querySelector('#add-to-wishlist');
        if (wishlistButton) {
            wishlistButton.addEventListener('click', () => {
                this.addToWishlist();
            });
        }

        // Quantity controls
        this.setupQuantityControls();

        // Product options
        this.setupProductOptions();

        // Image gallery
        this.setupImageGallery();
    }

    /**
     * Add product to cart
     */
    async addToCart() {
        const quantity = parseInt(document.querySelector('#quantity')?.value || 1);

        try {
            if (window.productSystem) {
                await window.productSystem.addToCart(this.productId, quantity);
            } else {
                // Fallback cart implementation
                const cart = JSON.parse(localStorage.getItem('cart')) || [];
                const existingItem = cart.find(item => item.id === this.productId);

                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cart.push({
                        id: this.productId,
                        name: this.product.name,
                        price: this.product.price,
                        quantity: quantity
                    });
                }

                localStorage.setItem('cart', JSON.stringify(cart));
                this.updateCartBadge();
                this.showSuccess(`${this.product.name} added to cart!`);
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            this.showError('Failed to add item to cart');
        }
    }

    /**
     * Add to wishlist
     */
    async addToWishlist() {
        // Wishlist functionality would need to be implemented
        console.log('Add to wishlist:', this.productId);
        this.showSuccess('Added to wishlist!');
    }

    /**
     * Setup quantity controls
     */
    setupQuantityControls() {
        const decreaseBtn = document.querySelector('#qty-decrease');
        const increaseBtn = document.querySelector('#qty-increase');
        const quantityInput = document.querySelector('#quantity');

        if (decreaseBtn && increaseBtn && quantityInput) {
            decreaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });

            increaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue < 10) {
                    quantityInput.value = currentValue + 1;
                }
            });
        }
    }

    /**
     * Setup product options
     */
    setupProductOptions() {
        // Color options
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('color-option--active'));
                option.classList.add('color-option--active');

                const selectedColorElement = document.querySelector('#selected-color');
                if (selectedColorElement) {
                    selectedColorElement.textContent = option.dataset.color;
                }
            });
        });
    }

    /**
     * Setup image gallery
     */
    setupImageGallery() {
        const thumbnails = document.querySelectorAll('.gallery__thumbnail');
        const mainImage = document.querySelector('#current-image');

        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => {
                thumbnails.forEach(thumb => thumb.classList.remove('gallery__thumbnail--active'));
                thumbnail.classList.add('gallery__thumbnail--active');

                if (mainImage) {
                    mainImage.src = thumbnail.dataset.image;
                }
            });
        });
    }

    /**
     * Update cart badge
     */
    updateCartBadge() {
        const cartBadge = document.querySelector('#cart-count');
        if (cartBadge) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            cartBadge.textContent = count;
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
        notification.className = 'product-display-notification';
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

// Initialize the product display when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDisplay = new ProductDisplayIntegration();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.productDisplay.initialize();
        });
    } else {
        window.productDisplay.initialize();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductDisplayIntegration;
}