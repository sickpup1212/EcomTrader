/**
 * Enhanced Catalog with Full Backend Integration
 * Connects catalog to real database products via API
 * Maintains zen design principles while providing dynamic functionality
 */

class EnhancedCatalogIntegrated {
  constructor() {
    this.apiBase = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : '/api';
    this.products = [];
    this.filteredProducts = [];
    this.categories = [];
    this.filters = {
      category: [],
      price: [],
      search: '',
      stock: 'all'
    };
    this.sortBy = 'name';
    this.currentPage = 1;
    this.productsPerPage = 24;
    this.totalProducts = 0;
    this.loading = false;

    this.init();
  }

  async init() {
    try {
      this.showLoadingState();

      // Load initial data
      await Promise.all([
        this.loadCategories(),
        this.loadProducts()
      ]);

      // Setup event listeners
      this.setupEventListeners();

      // Setup infinite scroll
      this.setupInfiniteScroll();

      this.hideLoadingState();
      console.log('Enhanced catalog initialized with backend integration');
    } catch (error) {
      console.error('Failed to initialize catalog:', error);
      this.showErrorState('Unable to load products. Please refresh the page.');
    }
  }

  async loadCategories() {
    try {
      const response = await fetch(`${this.apiBase}/products/categories`);
      const data = await response.json();
      this.categories = data.data || [];
      this.updateCategoryFilters();
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Continue with static categories if API fails
      this.categories = [
        { id: 'cat-electronics', name: 'Electronics', product_count: 0 },
        { id: 'cat-clothing', name: 'Clothing', product_count: 0 },
        { id: 'cat-books', name: 'Books', product_count: 0 },
        { id: 'cat-home', name: 'Home & Garden', product_count: 0 },
        { id: 'cat-sports', name: 'Sports', product_count: 0 }
      ];
      this.updateCategoryFilters();
    }
  }

  updateCategoryFilters() {
    const categorySelect = document.querySelector('.filter-select[aria-label="Category filter"]');
    if (categorySelect) {
      // Clear existing options except "All Categories"
      categorySelect.innerHTML = '<option>All Categories</option>';

      this.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.name} (${category.product_count || 0})`;
        categorySelect.appendChild(option);
      });
    }
  }

  async loadProducts(append = false) {
    if (this.loading) return;

    this.loading = true;
    this.showLoadingState();

    try {
      const params = new URLSearchParams({
        page: this.currentPage.toString(),
        limit: this.productsPerPage.toString(),
        sort: this.sortBy
      });

      // Add filters
      if (this.filters.category.length > 0) {
        params.append('category', this.filters.category.join(','));
      }
      if (this.filters.search) {
        params.append('search', this.filters.search);
      }
      if (this.filters.stock !== 'all') {
        params.append('stock', this.filters.stock);
      }

      const response = await fetch(`${this.apiBase}/products?${params}`);
      const data = await response.json();

      if (data.success && data.data) {
        const newProducts = data.data.products || [];

        if (append) {
          this.products = [...this.products, ...newProducts];
        } else {
          this.products = newProducts;
        }

        this.totalProducts = data.data.pagination?.total || newProducts.length;

        // Apply client-side filtering for price range
        this.applyClientSideFilters();

        // Update category counts
        this.updateCategoryCounts();
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showErrorState('Failed to load products. Please try again.');
    } finally {
      this.loading = false;
      this.hideLoadingState();
    }
  }

  applyClientSideFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Price filtering (client-side since backend doesn't support it)
      if (this.filters.price.length > 0) {
        const price = parseFloat(product.price.amount);
        const priceMatch = this.filters.price.some(range => {
          if (range === '0-25') return price <= 25;
          if (range === '25-50') return price > 25 && price <= 50;
          if (range === '50-100') return price > 50 && price <= 100;
          if (range === '100+') return price > 100;
          return false;
        });
        if (!priceMatch) return false;
      }

      return true;
    });

    this.renderProducts();
    this.updateResultsCount();
  }

  updateCategoryCounts() {
    const categoryCounts = {};
    this.products.forEach(product => {
      const categoryId = product.category?.id;
      if (categoryId) {
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      }
    });

    // Update category filter options with counts
    const categorySelect = document.querySelector('.filter-select[aria-label="Category filter"]');
    if (categorySelect) {
      const options = categorySelect.querySelectorAll('option');
      options.forEach(option => {
        if (option.value !== 'All Categories') {
          const count = categoryCounts[option.value] || 0;
          const currentText = option.textContent;
          const baseText = currentText.split(' (')[0];
          option.textContent = `${baseText} (${count})`;
        }
      });
    }
  }

  renderProducts() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    // Clear existing content if not appending
    if (this.currentPage === 1) {
      productGrid.innerHTML = '';
    }

    if (this.filteredProducts.length === 0) {
      this.showNoProductsMessage();
      return;
    }

    this.filteredProducts.forEach(product => {
      const productCard = this.createProductCard(product);
      productGrid.appendChild(productCard);
    });
  }

  createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card--enhanced';
    card.dataset.productId = product.id;

    // Calculate discount percentage
    const hasDiscount = product.price.originalAmount &&
                      product.price.originalAmount > product.price.amount;
    const discountPercentage = hasDiscount
      ? Math.round(((product.price.originalAmount - product.price.amount) / product.price.originalAmount) * 100)
      : 0;

    // Generate badges
    const badges = [];
    if (product.metadata?.isFeatured) badges.push('Featured');
    if (discountPercentage > 0) badges.push(`${discountPercentage}% OFF`);
    if (product.stock?.status === 'low_stock') badges.push('Low Stock');
    if (product.stock?.status === 'out_of_stock') badges.push('Out of Stock');

    // Generate rating
    const averageRating = product.rating?.average || 0;
    const ratingCount = product.rating?.count || 0;
    const stars = this.generateStars(averageRating);

    card.innerHTML = `
      <!-- Compare Checkbox -->
      <div class="product-card__compare">
        <label class="compare-checkbox" title="Add to compare">
          <input type="checkbox" class="visually-hidden">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="12" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <rect x="6" y="6" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </label>
      </div>

      <!-- Badges -->
      <div class="product-card__badges">
        ${badges.map(badge => {
          if (badge.includes('OFF')) {
            return `<span class="product-card__badge product-card__badge--sale">${badge}</span>`;
          } else if (badge === 'Low Stock') {
            return `<span class="product-card__badge" style="background: var(--color-warning-500);">${badge}</span>`;
          } else if (badge === 'Out of Stock') {
            return `<span class="product-card__badge" style="background: var(--color-error-500);">${badge}</span>`;
          }
          return `<span class="product-card__badge product-card__badge--${badge.toLowerCase()}">${badge}</span>`;
        }).join('')}
      </div>

      <!-- Image Container -->
      <div class="product-card__image-container">
        <div class="image-skeleton"></div>
        ${product.images && product.images.length > 0
          ? `<img src="${product.images[0].url}" alt="${product.images[0].alt || product.name}"
                 class="product-card__image" loading="lazy">`
          : `<svg class="placeholder-icon" viewBox="0 0 80 80" fill="none">
               <rect x="10" y="20" width="60" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
               <circle cx="30" cy="35" r="5" stroke="currentColor" stroke-width="2"/>
               <path d="M10 50L25 35L35 45L55 25L70 40V60H10V50Z" fill="currentColor" opacity="0.2"/>
             </svg>`
        }

        <!-- Quick Actions -->
        <div class="product-card__quick-actions">
          <button class="quick-action-btn" aria-label="Quick view" title="Quick view">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </button>
          <button class="quick-action-btn" aria-label="Add to wishlist" title="Add to wishlist">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 17L3 10C1 8 1 5 3 3C5 1 8 1 10 3C12 1 15 1 17 3C19 5 19 8 17 10L10 17Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="product-card__content-enhanced">
        <!-- Header -->
        <div class="product-card__header">
          <span class="product-card__category">${product.category?.name || 'Uncategorized'}</span>
          <span class="product-card__sku">SKU: ${product.sku || product.id}</span>
        </div>

        <!-- Title -->
        <h2 class="product-card__title">${product.name}</h2>

        <!-- Description -->
        <p class="product-card__description">
          ${product.shortDescription || product.description || this.truncateText(product.description, 100)}
        </p>

        <!-- Rating -->
        <div class="product-card__rating-enhanced">
          <div class="rating-stars">${stars}</div>
          <span class="rating-info">${averageRating.toFixed(1)} (${ratingCount} reviews)</span>
        </div>

        <!-- Price -->
        <div class="product-card__price-enhanced">
          <span class="price-current">$${product.price.amount}</span>
          ${hasDiscount ? `<span class="price-original">$${product.price.originalAmount}</span>` : ''}
        </div>

        <!-- Shipping -->
        <div class="product-card__shipping">
          <svg class="shipping-icon" viewBox="0 0 12 12" fill="currentColor">
            <path d="M1 6L4 3L7 6M4 3V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="9" cy="9" r="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
          Free shipping on orders over $50
        </div>

        <!-- Stock Status -->
        <div class="product-card__stock">
          <span class="stock-indicator stock-indicator--${product.stock?.status || 'in-stock'}"></span>
          <span>${this.formatStockStatus(product.stock?.status, product.stock?.quantity)}</span>
        </div>

        <!-- Actions -->
        <div class="product-card__actions-enhanced">
          <button class="btn-enhanced btn-enhanced--primary"
                  onclick="enhancedCatalog.addToCart('${product.id}')"
                  ${product.stock?.status === 'out_of_stock' ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2H4L5 10H13L15 4H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${product.stock?.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <a href="enhanced-product-display.html?id=${product.id}" class="btn-enhanced btn-enhanced--secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </a>
        </div>
      </div>
    `;

    return card;
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="rating-star">★</span>';
    }
    if (hasHalfStar) {
      stars += '<span class="rating-star rating-star--half">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="rating-star rating-star--empty">★</span>';
    }
    return stars;
  }

  formatStockStatus(status, quantity) {
    switch (status) {
      case 'in_stock':
        return 'In Stock - Ships today';
      case 'low_stock':
        return `Only ${quantity} left in stock`;
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'In Stock';
    }
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  async addToCart(productId) {
    try {
      // Get product details
      const response = await fetch(`${this.apiBase}/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        const product = data.data;

        // Add to cart (using localStorage for now)
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            id: productId,
            name: product.name,
            price: product.price.amount,
            quantity: 1,
            image: product.images?.[0]?.url || ''
          });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartBadge();
        this.showNotification(`${product.name} added to cart!`, 'success');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      this.showNotification('Failed to add item to cart', 'error');
    }
  }

  updateCartBadge() {
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      cartBadge.textContent = count;
    }
  }

  updateResultsCount() {
    const resultsCount = document.querySelector('.results-count strong');
    if (resultsCount) {
      resultsCount.textContent = this.filteredProducts.length;
    }
  }

  showNoProductsMessage() {
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
      productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style="margin: 0 auto 20px; opacity: 0.3;">
            <circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="2"/>
            <path d="M30 30L50 50M50 30L30 50" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <h3 style="color: var(--color-neutral-600); margin-bottom: 8px;">No products found</h3>
          <p style="color: var(--color-neutral-500);">Try adjusting your filters or search terms</p>
        </div>
      `;
    }
  }

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

    // Sidebar filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const filterType = e.target.name;
        const filterValue = e.target.value;

        if (e.target.checked) {
          if (!this.filters[filterType].includes(filterValue)) {
            this.filters[filterType].push(filterValue);
          }
        } else {
          this.filters[filterType] = this.filters[filterType].filter(
            value => value !== filterValue
          );
        }

        this.applyClientSideFilters();
      });
    });
  }

  handleSearch(searchTerm) {
    this.filters.search = searchTerm;
    this.currentPage = 1;
    this.loadProducts();
  }

  handleFilters() {
    const categoryFilter = document.querySelector('.filter-select[aria-label="Category filter"]');
    const priceFilter = document.querySelector('.filter-select[aria-label="Price range filter"]');
    const sortFilter = document.querySelector('.filter-select[aria-label="Sort products"]');

    if (categoryFilter && categoryFilter.value !== 'All Categories') {
      this.filters.category = [categoryFilter.value];
    } else {
      this.filters.category = [];
    }

    if (priceFilter && priceFilter.value !== 'All Prices') {
      this.filters.price = [priceFilter.value];
    } else {
      this.filters.price = [];
    }

    if (sortFilter) {
      this.sortBy = sortFilter.value.toLowerCase().replace(' ', '_');
    }

    this.currentPage = 1;
    this.loadProducts();
  }

  setupInfiniteScroll() {
    let isLoading = false;

    const loadMore = async () => {
      if (isLoading || this.products.length >= this.totalProducts) return;

      isLoading = true;
      this.currentPage++;
      await this.loadProducts(true);
      isLoading = false;
    };

    const scrollHandler = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', scrollHandler);
  }

  showLoadingState() {
    // Show skeleton loaders
    const skeletons = document.querySelectorAll('.product-skeleton');
    skeletons.forEach(skeleton => skeleton.style.display = 'block');
  }

  hideLoadingState() {
    // Hide skeleton loaders
    const skeletons = document.querySelectorAll('.product-skeleton');
    skeletons.forEach(skeleton => skeleton.style.display = 'none');
  }

  showErrorState(message) {
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
      productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <h3 style="color: var(--color-error-600); margin-bottom: 8px;">Error</h3>
          <p style="color: var(--color-neutral-600);">${message}</p>
          <button onclick="enhancedCatalog.loadProducts()" class="btn-enhanced btn-enhanced--primary" style="margin-top: 16px;">
            Try Again
          </button>
        </div>
      `;
    }
  }

  showNotification(message, type = 'success') {
    // Create a simple notification
    const notification = document.createElement('div');
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
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedCatalog = new EnhancedCatalogIntegrated();
});

// Global function for onclick handlers
window.addToCart = function(productId) {
  if (window.enhancedCatalog) {
    window.enhancedCatalog.addToCart(productId);
  }
};

window.loadMoreProducts = function() {
  if (window.enhancedCatalog) {
    window.enhancedCatalog.currentPage++;
    window.enhancedCatalog.loadProducts(true);
  }
};