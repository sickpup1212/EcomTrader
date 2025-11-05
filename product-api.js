/**
 * Product API Integration Module
 * Dynamic content loading and real-time updates
 * Maintaining zen flow while providing powerful backend connectivity
 */

class ProductAPI {
  constructor() {
    this.baseURL = '/api'; // Adjust based on your backend structure
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.retryLimit = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generic API request method with caching and retry logic
   */
  async request(endpoint, options = {}) {
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    let lastError;

    for (let attempt = 1; attempt <= this.retryLimit; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
          },
          ...options
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache the response
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });

        return data;

      } catch (error) {
        lastError = error;

        if (attempt < this.retryLimit) {
          // Exponential backoff
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get products with optional filtering and pagination
   */
  async getProducts(params = {}) {
    const {
      page = 1,
      limit = 24,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'featured',
      featured,
      onSale,
      inStock
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort
    });

    // Add optional filters
    if (category) queryParams.append('category', category);
    if (minPrice) queryParams.append('minPrice', minPrice.toString());
    if (maxPrice) queryParams.append('maxPrice', maxPrice.toString());
    if (search) queryParams.append('search', search);
    if (featured) queryParams.append('featured', 'true');
    if (onSale) queryParams.append('onSale', 'true');
    if (inStock) queryParams.append('inStock', 'true');

    return this.request(`/products?${queryParams}`);
  }

  /**
   * Get single product by ID
   */
  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  /**
   * Get product variations (colors, sizes, etc.)
   */
  async getProductVariations(productId) {
    return this.request(`/products/${productId}/variations`);
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId, limit = 8) {
    return this.request(`/products/${productId}/related?limit=${limit}`);
  }

  /**
   * Get product reviews
   */
  async getProductReviews(productId, page = 1, limit = 10) {
    return this.request(`/products/${productId}/reviews?page=${page}&limit=${limit}`);
  }

  /**
   * Submit product review
   */
  async submitReview(productId, reviewData) {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  /**
   * Get product categories
   */
  async getCategories() {
    return this.request('/categories');
  }

  /**
   * Search products
   */
  async searchProducts(query, filters = {}) {
    return this.getProducts({
      search: query,
      ...filters
    });
  }

  /**
   * Check real-time stock status
   */
  async checkStock(productId, variationId = null) {
    const endpoint = variationId
      ? `/products/${productId}/stock/${variationId}`
      : `/products/${productId}/stock`;

    return this.request(endpoint);
  }

  /**
   * Get product availability notification
   */
  async subscribeToStockNotification(productId, email) {
    return this.request(`/products/${productId}/notify`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Get recently viewed products
   */
  async getRecentlyViewed(limit = 8) {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

    if (recentlyViewed.length === 0) {
      return { products: [] };
    }

    const ids = recentlyViewed.slice(0, limit).join(',');
    return this.request(`/products/recently-viewed?ids=${ids}`);
  }

  /**
   * Add product to recently viewed
   */
  addToRecentlyViewed(productId) {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

    // Remove if already exists
    const index = recentlyViewed.indexOf(productId);
    if (index > -1) {
      recentlyViewed.splice(index, 1);
    }

    // Add to beginning
    recentlyViewed.unshift(productId);

    // Keep only last 20 items
    if (recentlyViewed.length > 20) {
      recentlyViewed.splice(20);
    }

    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }

  /**
   * Get product recommendations based on user behavior
   */
  async getRecommendations(userId = null, productId = null) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (productId) params.append('productId', productId);

    return this.request(`/recommendations?${params}`);
  }

  /**
   * Get popular products
   */
  async getPopularProducts(limit = 12, timeframe = 'week') {
    return this.request(`/products/popular?limit=${limit}&timeframe=${timeframe}`);
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(limit = 12) {
    return this.request(`/products/trending?limit=${limit}`);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Preload products for better performance
   */
  async preloadProducts(category = null) {
    try {
      const products = await this.getProducts({
        category,
        limit: 50
      });

      // Preload first few product images
      products.data.slice(0, 6).forEach(product => {
        if (product.images && product.images[0]) {
          const img = new Image();
          img.src = product.images[0];
        }
      });

      return products;
    } catch (error) {
      console.warn('Failed to preload products:', error);
      return { data: [] };
    }
  }
}

/**
 * Product Display Manager
 * Handles dynamic content loading and real-time updates
 */
class ProductDisplayManager {
  constructor() {
    this.api = new ProductAPI();
    this.currentProduct = null;
    this.realtimeUpdates = null;
    this.wishlist = this.loadWishlist();
    this.compareList = this.loadCompareList();
  }

  /**
   * Initialize product display with dynamic loading
   */
  async initializeProductDisplay(productId) {
    try {
      // Show loading state
      this.showLoadingState();

      // Load product data
      const product = await this.api.getProduct(productId);
      this.currentProduct = product;

      // Update recently viewed
      this.api.addToRecentlyViewed(productId);

      // Load additional data in parallel
      const [variations, related, reviews] = await Promise.all([
        this.api.getProductVariations(productId),
        this.api.getRelatedProducts(productId),
        this.api.getProductReviews(productId, 1, 5)
      ]);

      // Render product with all data
      this.renderProduct(product, variations, related, reviews);

      // Setup real-time updates
      this.setupRealtimeUpdates(productId);

      // Hide loading state
      this.hideLoadingState();

    } catch (error) {
      console.error('Failed to load product:', error);
      this.showErrorState('Unable to load product. Please try again later.');
    }
  }

  /**
   * Initialize catalog with dynamic filtering
   */
  async initializeCatalog(filters = {}) {
    try {
      this.showLoadingState();

      const response = await this.api.getProducts({
        limit: 24,
        ...filters
      });

      this.renderProductGrid(response.data);
      this.updateResultsCount(response.total, response.page, response.limit);

      // Setup infinite scroll
      this.setupInfiniteScroll(filters);

      this.hideLoadingState();

    } catch (error) {
      console.error('Failed to load catalog:', error);
      this.showErrorState('Unable to load products. Please try again later.');
    }
  }

  /**
   * Setup real-time stock and price updates
   */
  setupRealtimeUpdates(productId) {
    // Clear existing updates
    if (this.realtimeUpdates) {
      clearInterval(this.realtimeUpdates);
    }

    // Check stock every 30 seconds
    this.realtimeUpdates = setInterval(async () => {
      try {
        const stockData = await this.api.checkStock(productId);
        this.updateStockDisplay(stockData);
      } catch (error) {
        console.warn('Failed to check stock:', error);
      }
    }, 30000);
  }

  /**
   * Update stock display with real-time data
   */
  updateStockDisplay(stockData) {
    const stockBanner = document.querySelector('.stock-status-banner');
    if (!stockBanner) return;

    const { inStock, quantity, lowStockThreshold = 5 } = stockData;

    // Remove existing classes
    stockBanner.classList.remove(
      'stock-status-banner--in-stock',
      'stock-status-banner--low-stock',
      'stock-status-banner--out-of-stock'
    );

    if (inStock) {
      if (quantity <= lowStockThreshold) {
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

      // Enable add to cart button
      const addToCartBtn = document.getElementById('add-to-cart');
      if (addToCartBtn) {
        addToCartBtn.disabled = false;
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

      // Disable add to cart button
      const addToCartBtn = document.getElementById('add-to-cart');
      if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Out of Stock';
      }
    }
  }

  /**
   * Setup infinite scroll for catalog
   */
  setupInfiniteScroll(filters) {
    let loading = false;
    let page = 1;

    const loadMore = async () => {
      if (loading) return;

      loading = true;
      page++;

      try {
        const response = await this.api.getProducts({
          ...filters,
          page,
          limit: 24
        });

        if (response.data.length > 0) {
          this.appendProductGrid(response.data);
        } else {
          // No more products, remove infinite scroll
          window.removeEventListener('scroll', scrollHandler);
        }
      } catch (error) {
        console.error('Failed to load more products:', error);
      } finally {
        loading = false;
      }
    };

    const scrollHandler = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', Voltage.throttle(scrollHandler, 200));
  }

  /**
   * Load and render search results
   */
  async performSearch(query, filters = {}) {
    try {
      this.showLoadingState();

      const response = await this.api.searchProducts(query, filters);

      this.renderProductGrid(response.data);
      this.updateResultsCount(response.total, response.page, response.limit);

      this.hideLoadingState();

      // Track search analytics
      this.trackSearch(query, response.total);

    } catch (error) {
      console.error('Search failed:', error);
      this.showErrorState('Search failed. Please try again later.');
    }
  }

  /**
   * Track search for analytics
   */
  trackSearch(query, resultCount) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'search', {
        search_term: query,
        results_count: resultCount
      });
    }
  }

  /**
   * Toggle wishlist
   */
  toggleWishlist(productId) {
    const index = this.wishlist.indexOf(productId);

    if (index > -1) {
      this.wishlist.splice(index, 1);
      this.showNotification('Removed from wishlist', 'info');
    } else {
      this.wishlist.push(productId);
      this.showNotification('Added to wishlist', 'success');
    }

    this.saveWishlist();
    this.updateWishlistButtons(productId);
  }

  /**
   * Toggle compare list
   */
  toggleCompare(productId) {
    if (this.compareList.includes(productId)) {
      this.compareList = this.compareList.filter(id => id !== productId);
      this.showNotification('Removed from compare', 'info');
    } else {
      if (this.compareList.length >= 4) {
        this.showNotification('Maximum 4 products can be compared', 'warning');
        return false;
      }
      this.compareList.push(productId);
      this.showNotification('Added to compare', 'success');
    }

    this.saveCompareList();
    this.updateCompareButtons(productId);
    this.updateComparePanel();
    return true;
  }

  /**
   * Load more reviews with pagination
   */
  async loadMoreReviews(productId, page = 2) {
    try {
      const response = await this.api.getProductReviews(productId, page, 5);

      if (response.data.length > 0) {
        this.appendReviews(response.data);
      } else {
        // No more reviews
        const loadMoreBtn = document.querySelector('.load-more-reviews');
        if (loadMoreBtn) {
          loadMoreBtn.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Failed to load more reviews:', error);
    }
  }

  /**
   * Submit product review
   */
  async submitReview(productId, reviewData) {
    try {
      const response = await this.api.submitReview(productId, reviewData);

      this.showNotification('Review submitted successfully!', 'success');

      // Reload reviews
      const reviews = await this.api.getProductReviews(productId, 1, 5);
      this.renderReviews(reviews.data);

      return response;
    } catch (error) {
      console.error('Failed to submit review:', error);
      this.showNotification('Failed to submit review. Please try again.', 'error');
      throw error;
    }
  }

  /**
   * Rendering methods
   */
  renderProduct(product, variations, related, reviews) {
    // This would be implemented based on your specific HTML structure
    console.log('Rendering product:', product);
  }

  renderProductGrid(products) {
    // This would be implemented based on your specific HTML structure
    console.log('Rendering product grid:', products);
  }

  appendProductGrid(products) {
    // This would append more products to existing grid
    console.log('Appending products:', products);
  }

  renderReviews(reviews) {
    // This would render reviews in the reviews section
    console.log('Rendering reviews:', reviews);
  }

  appendReviews(reviews) {
    // This would append more reviews to existing list
    console.log('Appending reviews:', reviews);
  }

  updateResultsCount(total, page, limit) {
    const resultsCount = document.querySelector('.results-count strong');
    if (resultsCount) {
      const start = (page - 1) * limit + 1;
      const end = Math.min(page * limit, total);
      resultsCount.textContent = `${start}-${end} of ${total}`;
    }
  }

  updateWishlistButtons(productId) {
    const wishlistButtons = document.querySelectorAll(`[data-product-id="${productId}"][data-action="wishlist"]`);
    wishlistButtons.forEach(button => {
      const isWishlisted = this.wishlist.includes(productId);
      button.classList.toggle('active', isWishlisted);
      button.setAttribute('aria-pressed', isWishlisted.toString());
    });
  }

  updateCompareButtons(productId) {
    const compareButtons = document.querySelectorAll(`[data-product-id="${productId}"][data-action="compare"]`);
    compareButtons.forEach(button => {
      const isSelected = this.compareList.includes(productId);
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-pressed', isSelected.toString());
    });
  }

  updateComparePanel() {
    const comparePanel = document.querySelector('.compare-panel');
    if (!comparePanel) return;

    if (this.compareList.length > 0) {
      comparePanel.style.display = 'block';
      // Update compare panel content
    } else {
      comparePanel.style.display = 'none';
    }
  }

  showLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-state');
    loadingElements.forEach(el => el.style.display = 'block');
  }

  hideLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-state');
    loadingElements.forEach(el => el.style.display = 'none');
  }

  showErrorState(message) {
    const errorElements = document.querySelectorAll('.error-state');
    errorElements.forEach(el => {
      el.style.display = 'block';
      if (message) {
        el.textContent = message;
      }
    });
  }

  showNotification(message, type = 'info') {
    if (window.Voltage && window.Voltage.toast) {
      window.Voltage.toast.show(message, type);
    } else {
      // Fallback notification
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Local storage helpers
   */
  loadWishlist() {
    try {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    } catch {
      return [];
    }
  }

  saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
  }

  loadCompareList() {
    try {
      return JSON.parse(localStorage.getItem('compareList') || '[]');
    } catch {
      return [];
    }
  }

  saveCompareList() {
    localStorage.setItem('compareList', JSON.stringify(this.compareList));
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.realtimeUpdates) {
      clearInterval(this.realtimeUpdates);
    }
    this.api.clearCache();
  }
}

/**
 * Initialize and export
 */
const productAPI = new ProductAPI();
const productDisplayManager = new ProductDisplayManager();

// Export for global use
window.ProductAPI = ProductAPI;
window.productAPI = productAPI;
window.ProductDisplayManager = ProductDisplayManager;
window.productDisplayManager = productDisplayManager;

export { ProductAPI, ProductDisplayManager, productAPI, productDisplayManager };