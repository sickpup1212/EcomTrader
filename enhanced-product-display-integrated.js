/**
 * Enhanced Product Display with Full Backend Integration
 * Connects product display pages to real database products via API
 * Maintains zen design principles while providing dynamic functionality
 */

class EnhancedProductDisplayIntegrated {
  constructor() {
    this.apiBase = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : '/api';
    this.productId = this.getProductIdFromUrl();
    this.product = null;
    this.reviews = [];
    this.relatedProducts = [];
    this.selectedColor = null;
    this.quantity = 1;

    if (this.productId) {
      this.init();
    }
  }

  getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  async init() {
    try {
      this.showLoadingState();

      // Load product data
      await Promise.all([
        this.loadProduct(),
        this.loadProductReviews(),
        this.loadRelatedProducts()
      ]);

      // Setup interactions
      this.setupInteractions();

      this.hideLoadingState();
      console.log('Enhanced product display initialized successfully');
    } catch (error) {
      console.error('Failed to initialize product display:', error);
      this.showErrorState('Unable to load product. Please try again later.');
    }
  }

  async loadProduct() {
    try {
      const response = await fetch(`${this.apiBase}/products/${this.productId}`);
      const data = await response.json();

      if (data.success) {
        this.product = data.data;
        this.updateProductDisplay();
        this.updateDocumentMeta();
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      throw error;
    }
  }

  updateDocumentMeta() {
    // Update page title
    document.title = `${this.product.name} - Trader`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = this.product.shortDescription || this.product.description || '';
    }

    // Update breadcrumb
    this.updateBreadcrumb();
  }

  updateBreadcrumb() {
    const breadcrumbCurrent = document.querySelector('.breadcrumb-enhanced__current');
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = this.product.name;
    }

    // Update category links
    const categoryLinks = document.querySelectorAll('.breadcrumb-enhanced__link');
    categoryLinks.forEach((link, index) => {
      if (index === 1 && this.product.category) {
        link.textContent = this.product.category.name;
        link.href = `enhanced-catalog.html?category=${this.product.category.id}`;
      }
    });
  }

  updateProductDisplay() {
    // Update gallery
    this.updateGallery();

    // Update product info
    this.updateProductInfo();

    // Update price
    this.updatePrice();

    // Update product options
    this.updateProductOptions();

    // Update stock status
    this.updateStockStatus();

    // Update product details
    this.updateProductDetails();

    // Initialize selected color
    if (this.product.attributes?.colors && this.product.attributes.colors.length > 0) {
      this.selectedColor = this.product.attributes.colors[0];
    }
  }

  updateGallery() {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.getElementById('thumbnails');

    if (mainImage && this.product.images && this.product.images.length > 0) {
      // Update main image
      mainImage.src = this.product.images[0].url;
      mainImage.alt = this.product.images[0].alt || this.product.name;

      // Update thumbnails
      if (thumbnails) {
        thumbnails.innerHTML = '';
        this.product.images.forEach((image, index) => {
          const thumbnail = document.createElement('button');
          thumbnail.className = `gallery-enhanced__thumbnail ${index === 0 ? 'gallery-enhanced__thumbnail--active' : ''}`;
          thumbnail.dataset.image = image.url;
          thumbnail.innerHTML = `<img src="${image.url}" alt="${image.alt || `View ${index + 1}`}" loading="lazy">`;

          thumbnail.addEventListener('click', () => {
            this.selectImage(index);
          });

          thumbnails.appendChild(thumbnail);
        });
      }
    }
  }

  selectImage(index) {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.gallery-enhanced__thumbnail');

    if (mainImage && this.product.images[index]) {
      // Fade effect
      mainImage.style.opacity = '0';
      setTimeout(() => {
        mainImage.src = this.product.images[index].url;
        mainImage.alt = this.product.images[index].alt || this.product.name;
        mainImage.style.opacity = '1';
      }, 200);

      // Update thumbnail active state
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('gallery-enhanced__thumbnail--active', i === index);
      });
    }
  }

  updateProductInfo() {
    // Update title
    const titleElement = document.querySelector('.product-title-enhanced');
    if (titleElement) {
      titleElement.textContent = this.product.name;
    }

    // Update subtitle/description
    const subtitleElement = document.querySelector('.product-subtitle');
    if (subtitleElement) {
      subtitleElement.textContent = this.product.shortDescription || this.product.description || '';
    }

    // Update rating
    this.updateRating();

    // Update badges
    this.updateBadges();
  }

  updateRating() {
    const ratingDisplay = document.getElementById('rating-display');
    const ratingInfo = document.querySelector('.rating-enhanced__info');

    if (ratingDisplay && this.product.rating) {
      const averageRating = this.product.rating.average || 0;
      const reviewCount = this.product.rating.count || 0;

      ratingDisplay.innerHTML = this.generateStars(averageRating);

      if (ratingInfo) {
        ratingInfo.innerHTML = `
          <span class="rating-enhanced__count">${averageRating.toFixed(1)}</span>
          <span>(${reviewCount} reviews)</span>
          <a href="#reviews" class="rating-enhanced__reviews">See all reviews</a>
        `;
      }
    }
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="rating-star-enhanced rating-star-enhanced--filled">★</span>';
    }
    if (hasHalfStar) {
      stars += '<span class="rating-star-enhanced rating-star-enhanced--half">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="rating-star-enhanced">★</span>';
    }
    return stars;
  }

  updateBadges() {
    const badgesContainer = document.querySelector('.product-badges-enhanced');
    if (!badgesContainer) return;

    const badges = [];

    // Stock status badge
    if (this.product.stock?.status === 'in_stock') {
      badges.push('<span class="product-badge-enhanced product-badge-enhanced--success">In Stock</span>');
    } else if (this.product.stock?.status === 'low_stock') {
      badges.push('<span class="product-badge-enhanced product-badge-enhanced--warning">Low Stock</span>');
    } else if (this.product.stock?.status === 'out_of_stock') {
      badges.push('<span class="product-badge-enhanced product-badge-enhanced--error">Out of Stock</span>');
    }

    // Featured badge
    if (this.product.metadata?.isFeatured) {
      badges.push('<span class="product-badge-enhanced product-badge-enhanced--exclusive">Featured</span>');
    }

    // Sale badge
    if (this.product.price.originalAmount && this.product.price.originalAmount > this.product.price.amount) {
      const discount = Math.round(((this.product.price.originalAmount - this.product.price.amount) / this.product.price.originalAmount) * 100);
      badges.push(`<span class="product-badge-enhanced product-badge-enhanced--sale">${discount}% OFF</span>`);
    }

    // New badge (based on creation date)
    const createdAt = new Date(this.product.metadata?.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (createdAt > thirtyDaysAgo) {
      badges.push('<span class="product-badge-enhanced product-badge-enhanced--new">New</span>');
    }

    badgesContainer.innerHTML = badges.join('');
  }

  updatePrice() {
    const currentPriceElement = document.querySelector('.price-current-enhanced');
    const originalPriceElement = document.querySelector('.price-original-enhanced');
    const savingsElement = document.querySelector('.price-savings-enhanced');

    if (currentPriceElement) {
      currentPriceElement.textContent = `$${this.product.price.amount}`;
    }

    if (originalPriceElement && this.product.price.originalAmount && this.product.price.originalAmount > this.product.price.amount) {
      originalPriceElement.textContent = `$${this.product.price.originalAmount}`;
      originalPriceElement.style.display = 'inline';
    }

    if (savingsElement && this.product.price.originalAmount && this.product.price.originalAmount > this.product.price.amount) {
      const savings = Math.round(((this.product.price.originalAmount - this.product.price.amount) / this.product.price.originalAmount) * 100);
      savingsElement.textContent = `Save ${savings}%`;
    }
  }

  updateStockStatus() {
    const stockBanner = document.querySelector('.stock-status-banner');
    if (!stockBanner) return;

    const { status, quantity } = this.product.stock || {};

    // Remove existing classes
    stockBanner.classList.remove(
      'stock-status-banner--in-stock',
      'stock-status-banner--low-stock',
      'stock-status-banner--out-of-stock'
    );

    if (status === 'in_stock') {
      if (quantity <= 5) {
        stockBanner.classList.add('stock-status-banner--low-stock');
        stockBanner.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M10 6V10M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Only ${quantity} left in stock</span>
        `;
      } else {
        stockBanner.classList.add('stock-status-banner--in-stock');
        stockBanner.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M7 10L9 12L13 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>In Stock - Ships today</span>
        `;
      }
    } else {
      stockBanner.classList.add('stock-status-banner--out-of-stock');
      stockBanner.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Out of Stock</span>
      `;
    }
  }

  updateProductOptions() {
    this.updateColorOptions();
    this.updateQuantityInfo();
  }

  updateColorOptions() {
    const colorSelector = document.getElementById('color-selector');
    if (!colorSelector || !this.product.attributes?.colors) return;

    colorSelector.innerHTML = '';
    this.product.attributes.colors.forEach((color, index) => {
      const colorButton = document.createElement('button');
      colorButton.className = `color-option-enhanced ${index === 0 ? 'color-option-enhanced--selected' : ''}`;

      if (typeof color === 'string') {
        colorButton.style.backgroundColor = color;
        colorButton.dataset.color = color;
        colorButton.setAttribute('aria-label', color);
        colorButton.innerHTML = `<span class="color-option-enhanced__tooltip">${color}</span>`;
      } else if (color.hex_code) {
        colorButton.style.backgroundColor = color.hex_code;
        colorButton.dataset.color = color.name;
        colorButton.setAttribute('aria-label', color.name);
        colorButton.innerHTML = `<span class="color-option-enhanced__tooltip">${color.name}</span>`;
      }

      colorButton.addEventListener('click', () => {
        this.selectColor(color, colorButton);
      });

      colorSelector.appendChild(colorButton);
    });

    // Update selected color display
    const selectedColorText = document.getElementById('selected-color');
    if (selectedColorText && this.product.attributes.colors.length > 0) {
      const firstColor = this.product.attributes.colors[0];
      selectedColorText.textContent = typeof firstColor === 'string' ? firstColor : firstColor.name;
    }
  }

  selectColor(color, button) {
    // Remove active state from all buttons
    const colorButtons = document.querySelectorAll('.color-option-enhanced');
    colorButtons.forEach(btn => btn.classList.remove('color-option-enhanced--selected'));

    // Add active state to clicked button
    button.classList.add('color-option-enhanced--selected');

    // Update selected color
    this.selectedColor = color;

    // Update display
    const selectedColorText = document.getElementById('selected-color');
    if (selectedColorText) {
      const colorName = typeof color === 'string' ? color : color.name;
      selectedColorText.textContent = colorName;
    }
  }

  updateQuantityInfo() {
    const quantityInfo = document.querySelector('.quantity-enhanced__info');
    if (quantityInfo && this.product.stock) {
      const { quantity, status } = this.product.stock;
      if (status === 'in_stock' && quantity <= 10) {
        quantityInfo.textContent = `Only ${quantity} left in stock`;
        quantityInfo.style.display = 'block';
      } else {
        quantityInfo.style.display = 'none';
      }
    }
  }

  updateProductDetails() {
    // Update details tab
    const detailsPanel = document.querySelector('#panel-details .content-section-enhanced__content');
    if (detailsPanel && this.product.description) {
      detailsPanel.innerHTML = `
        <p class="content-section-enhanced__text">${this.product.description}</p>
        <p class="content-section-enhanced__text">${this.product.shortDescription || ''}</p>
      `;
    }

    // Update specifications
    this.updateSpecifications();
  }

  updateSpecifications() {
    const specsGrid = document.querySelector('.specs-grid');
    if (!specsGrid) return;

    const specs = [
      { label: 'SKU', value: this.product.sku || 'N/A' },
      { label: 'Category', value: this.product.category?.name || 'N/A' },
      { label: 'Weight', value: this.product.physical?.weight ? `${this.product.physical.weight} lbs` : 'N/A' },
      { label: 'Stock Status', value: this.formatStockStatus(this.product.stock?.status) }
    ];

    // Add custom specifications if available
    if (this.product.attributes?.specifications) {
      this.product.attributes.specifications.forEach(spec => {
        specs.push({ label: spec.label, value: spec.value });
      });
    }

    specsGrid.innerHTML = specs.map(spec => `
      <div class="spec-item">
        <span class="spec-item__label">${spec.label}</span>
        <span class="spec-item__value">${spec.value}</span>
      </div>
    `).join('');
  }

  formatStockStatus(status) {
    const statusMap = {
      'in_stock': 'In Stock',
      'low_stock': 'Low Stock',
      'out_of_stock': 'Out of Stock',
      'discontinued': 'Discontinued'
    };
    return statusMap[status] || status;
  }

  async loadProductReviews() {
    try {
      const response = await fetch(`${this.apiBase}/products/${this.productId}/reviews`);
      const data = await response.json();

      if (data.success) {
        this.reviews = data.data.reviews || [];
        this.updateReviews();
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      // Continue without reviews
    }
  }

  updateReviews() {
    const reviewsContainer = document.querySelector('.reviews-enhanced');
    if (!reviewsContainer) return;

    if (this.reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div class="no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      `;
      return;
    }

    reviewsContainer.innerHTML = this.reviews.map(review => `
      <article class="review-card">
        <div class="review-card__header">
          <div class="review-card__author">
            <span class="review-card__name">${review.author_name || 'Anonymous'}</span>
            <div class="review-card__verified">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 0L9 5L14 6L10 10L11 14L7 12L3 14L4 10L0 6L5 5L7 0Z" stroke="currentColor" stroke-width="1" fill="none"/>
              </svg>
              Verified Purchase
            </div>
          </div>
          <time class="review-card__date">${this.formatDate(review.created_at)}</time>
        </div>
        <div class="review-card__content">
          <div class="rating-stars-enhanced">
            ${this.generateStars(review.rating)}
          </div>
          <p class="review-card__text">${review.comment}</p>
          <div class="review-card__helpful">
            <span class="review-card__helpful-text">Was this helpful?</span>
            <div class="review-card__helpful-buttons">
              <button class="review-card__helpful-btn">Yes (${review.helpful_count || 0})</button>
              <button class="review-card__helpful-btn">No (${review.not_helpful_count || 0})</button>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  }

  async loadRelatedProducts() {
    try {
      const response = await fetch(`${this.apiBase}/products/${this.productId}/related?limit=4`);
      const data = await response.json();

      if (data.success) {
        this.relatedProducts = data.data.products || [];
        this.updateRelatedProducts();
      }
    } catch (error) {
      console.error('Failed to load related products:', error);
      // Continue without related products
    }
  }

  updateRelatedProducts() {
    const relatedGrid = document.querySelector('.related-products__grid');
    if (!relatedGrid || this.relatedProducts.length === 0) return;

    relatedGrid.innerHTML = this.relatedProducts.map(product => `
      <div class="product-card--enhanced">
        <div class="product-card__image-container">
          ${product.images && product.images.length > 0
            ? `<img src="${product.images[0].url}" alt="${product.name}" class="product-card__image" loading="lazy">`
            : `<svg class="placeholder-icon" viewBox="0 0 80 80" fill="none">
                 <rect x="10" y="20" width="60" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
                 <circle cx="30" cy="35" r="5" stroke="currentColor" stroke-width="2"/>
                 <path d="M10 50L25 35L35 45L55 25L70 40V60H10V50Z" fill="currentColor" opacity="0.2"/>
               </svg>`
          }
        </div>
        <div class="product-card__content-enhanced">
          <h3 class="product-card__title">${product.name}</h3>
          <div class="product-card__price-enhanced">
            <span class="price-current">$${product.price.amount}</span>
          </div>
          <a href="enhanced-product-display.html?id=${product.id}" class="btn-enhanced btn-enhanced--secondary" style="width: 100%;">View Details</a>
        </div>
      </div>
    `).join('');
  }

  setupInteractions() {
    // Quantity controls
    this.setupQuantityControls();

    // Add to cart
    this.setupAddToCart();

    // Wishlist
    this.setupWishlist();

    // Tabs
    this.setupTabs();

    // Image gallery navigation
    this.setupGalleryNavigation();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  setupQuantityControls() {
    const decreaseBtn = document.getElementById('qty-decrease');
    const increaseBtn = document.getElementById('qty-increase');
    const quantityInput = document.getElementById('quantity');

    const updateQuantity = (delta) => {
      const current = parseInt(quantityInput.value) || 1;
      const min = parseInt(quantityInput.min) || 1;
      const max = parseInt(quantityInput.max) || 99;
      const newValue = Math.max(min, Math.min(max, current + delta));

      if (newValue !== current) {
        quantityInput.value = newValue;
        this.quantity = newValue;
      }
    };

    decreaseBtn?.addEventListener('click', () => updateQuantity(-1));
    increaseBtn?.addEventListener('click', () => updateQuantity(1));

    quantityInput?.addEventListener('change', (e) => {
      const newQuantity = parseInt(e.target.value);
      if (newQuantity >= 1 && newQuantity <= 99) {
        this.quantity = newQuantity;
      } else {
        e.target.value = this.quantity;
      }
    });
  }

  setupAddToCart() {
    const addToCartBtn = document.getElementById('add-to-cart');
    if (!addToCartBtn) return;

    addToCartBtn.addEventListener('click', () => {
      this.addToCart();
    });
  }

  async addToCart() {
    const addToCartBtn = document.getElementById('add-to-cart');
    if (!addToCartBtn || this.product.stock?.status === 'out_of_stock') return;

    // Disable button and show loading
    const originalContent = addToCartBtn.innerHTML;
    addToCartBtn.disabled = true;
    addToCartBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="31.4" stroke-linecap="round">
          <animate attributeName="stroke-dashoffset" dur="1s" to="0" repeatCount="1"/>
        </circle>
      </svg>
      Adding...
    `;

    try {
      // Add to cart using localStorage
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const cartItem = {
        id: this.product.id,
        name: this.product.name,
        price: this.product.price.amount,
        quantity: this.quantity,
        color: typeof this.selectedColor === 'string' ? this.selectedColor : this.selectedColor?.name,
        image: this.product.images?.[0]?.url || '',
        sku: this.product.sku
      };

      const existingItemIndex = cart.findIndex(item =>
        item.id === cartItem.id && item.color === cartItem.color
      );

      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += this.quantity;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem('cart', JSON.stringify(cart));

      // Show success state
      addToCartBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Added to Cart!
      `;

      // Update cart badge
      this.updateCartBadge();

      // Show notification
      this.showNotification(`${this.product.name} added to cart!`, 'success');

      // Reset button after delay
      setTimeout(() => {
        addToCartBtn.innerHTML = originalContent;
        addToCartBtn.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Failed to add to cart:', error);
      addToCartBtn.innerHTML = originalContent;
      addToCartBtn.disabled = false;
      this.showNotification('Failed to add item to cart', 'error');
    }
  }

  updateCartBadge() {
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      cartBadge.textContent = count;

      // Animate badge
      cartBadge.style.transform = 'scale(1.3)';
      setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
      }, 300);
    }
  }

  setupWishlist() {
    const wishlistBtn = document.getElementById('add-to-wishlist');
    if (!wishlistBtn) return;

    wishlistBtn.addEventListener('click', () => {
      this.toggleWishlist();
    });
  }

  toggleWishlist() {
    const wishlistBtn = document.getElementById('add-to-wishlist');
    let isWishlisted = false;

    // Check if already in wishlist (using localStorage)
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    isWishlisted = wishlist.includes(this.product.id);

    if (isWishlisted) {
      // Remove from wishlist
      const index = wishlist.indexOf(this.product.id);
      wishlist.splice(index, 1);

      wishlistBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20.84 4.61C19.35 3.12 17.15 2.62 15.14 3.31C13.89 3.71 12.85 4.59 12.21 5.71C11.57 4.59 10.53 3.71 9.28 3.31C7.27 2.62 5.07 3.12 3.58 4.61C2.09 6.1 1.59 8.3 2.28 10.31C2.68 11.56 3.56 12.6 4.68 13.24L12 21L19.32 13.24C20.44 12.6 21.32 11.56 21.72 10.31C22.41 8.3 21.91 6.1 20.84 4.61Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        Save
      `;
      wishlistBtn.style.background = '';
      wishlistBtn.style.color = '';

      this.showNotification('Removed from wishlist', 'info');
    } else {
      // Add to wishlist
      wishlist.push(this.product.id);

      wishlistBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61C19.35 3.12 17.15 2.62 15.14 3.31C13.89 3.71 12.85 4.59 12.21 5.71C11.57 4.59 10.53 3.71 9.28 3.31C7.27 2.62 5.07 3.12 3.58 4.61C2.09 6.1 1.59 8.3 2.28 10.31C2.68 11.56 3.56 12.6 4.68 13.24L12 21L19.32 13.24C20.44 12.6 21.32 11.56 21.72 10.31C22.41 8.3 21.91 6.1 20.84 4.61Z" stroke="currentColor" stroke-width="2" stroke-linejoin="red"/>
        </svg>
        Saved
      `;
      wishlistBtn.style.background = 'var(--color-error-500)';
      wishlistBtn.style.color = 'white';

      this.showNotification('Added to wishlist!', 'success');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.tabs-enhanced__tab');
    const panels = document.querySelectorAll('.tabs-enhanced__panel');

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        // Remove active state from all tabs and panels
        tabs.forEach(t => {
          t.classList.remove('tabs-enhanced__tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('tabs-enhanced__panel--active'));

        // Add active state to clicked tab and corresponding panel
        tab.classList.add('tabs-enhanced__tab--active');
        tab.setAttribute('aria-selected', 'true');

        if (panels[index]) {
          panels[index].classList.add('tabs-enhanced__panel--active');
        }

        // Smooth scroll to tabs section
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  setupGalleryNavigation() {
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');

    prevBtn?.addEventListener('click', () => this.navigateImage(-1));
    nextBtn?.addEventListener('click', () => this.navigateImage(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.navigateImage(-1);
      if (e.key === 'ArrowRight') this.navigateImage(1);
    });
  }

  navigateImage(direction) {
    if (!this.product.images || this.product.images.length <= 1) return;

    const currentImage = document.getElementById('main-image');
    const currentIndex = Array.from(document.querySelectorAll('.gallery-enhanced__thumbnail'))
      .findIndex(thumb => thumb.classList.contains('gallery-enhanced__thumbnail--active'));

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = this.product.images.length - 1;
    if (newIndex >= this.product.images.length) newIndex = 0;

    this.selectImage(newIndex);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Quick add to cart with 'A' key
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn && !addToCartBtn.disabled) {
          addToCartBtn.click();
        }
      }

      // Go to cart with 'C' key
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        window.location.href = 'checkout.html';
      }

      // Go back with Escape
      if (e.key === 'Escape' && document.activeElement.tagName !== 'INPUT') {
        window.history.back();
      }
    });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  showLoadingState() {
    // Could implement a loading overlay
    console.log('Loading product...');
  }

  hideLoadingState() {
    // Hide loading overlay
    console.log('Product loaded');
  }

  showErrorState(message) {
    const mainContent = document.querySelector('.product-layout');
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style="margin: 0 auto 20px; opacity: 0.3;">
            <circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="2"/>
            <path d="M30 30L50 50M50 30L30 50" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <h2 style="color: var(--color-error-600); margin-bottom: 8px;">Product Not Found</h2>
          <p style="color: var(--color-neutral-600); margin-bottom: 20px;">${message}</p>
          <a href="enhanced-catalog.html" class="btn-enhanced btn-enhanced--primary">Browse Products</a>
        </div>
      `;
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedProductDisplay = new EnhancedProductDisplayIntegrated();
});