/**
 * TRADER INTERACTION SYSTEM
 * Engineered by Vesper "Surge" Voltage
 * 
 * Every interaction is an electrical circuit - immediate, satisfying, alive.
 * This system transforms static designs into reactive experiences.
 */

// ============================================================================
// CORE UTILITIES - The Foundation Voltage
// ============================================================================

const Voltage = {
  // Debounce for search inputs and resize handlers
  debounce(fn, delay = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Throttle for scroll handlers
  throttle(fn, limit = 100) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Smooth animation frame loop
  animate(callback) {
    let rafId;
    const loop = (timestamp) => {
      callback(timestamp);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  },

  // Easing functions for natural motion
  easing: {
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeOutElastic: t => Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    spring: (t, stiffness = 0.3, damping = 0.7) => {
      return 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * stiffness) * damping;
    }
  }
};

// ============================================================================
// PARTICLE SYSTEM - Explosive Visual Feedback
// ============================================================================

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas || this.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isAnimating = false;
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    this.resizeCanvas(canvas);
    window.addEventListener('resize', () => this.resizeCanvas(canvas));
    return canvas;
  }

  resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  burst(x, y, color = '#3c6357', count = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
    if (!this.isAnimating) {
      this.startAnimation();
    }
  }

  startAnimation() {
    this.isAnimating = true;
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles = this.particles.filter(particle => {
        particle.update();
        particle.draw(this.ctx);
        return particle.life > 0;
      });

      if (this.particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
      }
    };
    animate();
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8 - 2;
    this.color = color;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.015;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.vx *= 0.98; // air resistance
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Global particle system
const particles = new ParticleSystem();

// ============================================================================
// TOAST NOTIFICATION SYSTEM - Non-blocking Feedback
// ============================================================================

class ToastManager {
  constructor() {
    this.container = this.createContainer();
    this.toasts = [];
  }

  createContainer() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${type === 'success' ? '#4ade80' : type === 'error' ? '#ef4444' : '#60a5fa'};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      font-size: 14px;
      font-weight: 600;
      pointer-events: auto;
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-size: 18px;">${icon}</span> ${message}`;

    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Auto dismiss
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        this.container.removeChild(toast);
        this.toasts = this.toasts.filter(t => t !== toast);
      }, 300);
    }, duration);

    return toast;
  }
}

const toast = new ToastManager();

// ============================================================================
// PRODUCT GALLERY - Image Switching with Smooth Transitions
// ============================================================================

function initProductGallery() {
  const mainImage = document.getElementById('current-image');
  const thumbnails = document.querySelectorAll('.gallery__thumbnail');
  const zoomBtn = document.getElementById('zoom-btn');

  if (!mainImage || thumbnails.length === 0) return;

  // Thumbnail switching
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', function() {
      const newImageSrc = this.dataset.image;
      
      // Remove active state from all thumbnails
      thumbnails.forEach(t => t.classList.remove('gallery__thumbnail--active'));
      
      // Add active state to clicked thumbnail
      this.classList.add('gallery__thumbnail--active');
      
      // Fade out current image
      mainImage.style.opacity = '0';
      mainImage.style.transform = 'scale(0.95)';
      
      // Switch image after fade
      setTimeout(() => {
        mainImage.src = newImageSrc;
        mainImage.style.opacity = '1';
        mainImage.style.transform = 'scale(1)';
      }, 200);

      // Haptic feedback (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });

    // Hover preview effect
    thumb.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
    });

    thumb.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });

  // Zoom functionality
  if (zoomBtn) {
    zoomBtn.addEventListener('click', function() {
      // Create lightbox
      const lightbox = document.createElement('div');
      lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: zoom-out;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;

      const img = document.createElement('img');
      img.src = mainImage.src;
      img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      `;

      lightbox.appendChild(img);
      document.body.appendChild(lightbox);

      // Animate in
      requestAnimationFrame(() => {
        lightbox.style.opacity = '1';
        img.style.transform = 'scale(1)';
      });

      // Close on click
      lightbox.addEventListener('click', () => {
        lightbox.style.opacity = '0';
        img.style.transform = 'scale(0.9)';
        setTimeout(() => document.body.removeChild(lightbox), 300);
      });

      // Close on escape
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          lightbox.click();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  // Add smooth transition to main image
  mainImage.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
}

// ============================================================================
// COLOR SELECTOR - Visual Feedback for Options
// ============================================================================

function initColorSelector() {
  const colorOptions = document.querySelectorAll('.color-option');
  const selectedColorText = document.getElementById('selected-color');

  if (colorOptions.length === 0) return;

  colorOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove active state from all options
      colorOptions.forEach(opt => opt.classList.remove('color-option--active'));
      
      // Add active state to clicked option
      this.classList.add('color-option--active');
      
      // Update selected color text
      if (selectedColorText) {
        const colorName = this.dataset.color;
        selectedColorText.textContent = colorName;
        
        // Pulse animation
        selectedColorText.style.transform = 'scale(1.1)';
        setTimeout(() => {
          selectedColorText.style.transform = 'scale(1)';
        }, 200);
      }

      // Visual feedback - scale animation
      this.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });
  });

  // Add transition to selected text
  if (selectedColorText) {
    selectedColorText.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
  }
}

// ============================================================================
// QUANTITY SELECTOR - Smooth Increment/Decrement
// ============================================================================

function initQuantitySelector() {
  const decreaseBtn = document.getElementById('qty-decrease');
  const increaseBtn = document.getElementById('qty-increase');
  const quantityInput = document.getElementById('quantity');

  if (!quantityInput) return;

  const updateQuantity = (delta) => {
    const current = parseInt(quantityInput.value) || 1;
    const min = parseInt(quantityInput.min) || 1;
    const max = parseInt(quantityInput.max) || 99;
    const newValue = Math.max(min, Math.min(max, current + delta));
    
    if (newValue !== current) {
      quantityInput.value = newValue;
      
      // Pulse animation
      quantityInput.style.transform = 'scale(1.1)';
      setTimeout(() => {
        quantityInput.style.transform = 'scale(1)';
      }, 150);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    }
  };

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => updateQuantity(-1));
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => updateQuantity(1));
  }

  // Add transition to input
  quantityInput.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
}

// ============================================================================
// ADD TO CART - Explosive Feedback
// ============================================================================

function initAddToCart() {
  const addToCartBtn = document.getElementById('add-to-cart');
  const cartBadge = document.getElementById('cart-count');

  if (!addToCartBtn) return;

  addToCartBtn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Particle burst
    particles.burst(x, y, '#3c6357', 30);

    // Button feedback
    this.style.transform = 'scale(0.95)';
    const originalBg = this.style.background;
    this.style.background = '#2e4a41';

    setTimeout(() => {
      this.style.transform = 'scale(1)';
      this.style.background = originalBg;
    }, 150);

    // Update cart count
    if (cartBadge) {
      const currentCount = parseInt(cartBadge.textContent) || 0;
      const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
      cartBadge.textContent = currentCount + quantity;
      
      // Badge pulse
      cartBadge.style.transform = 'scale(1.3)';
      setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
      }, 300);
    }

    // Toast notification
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
    toast.show(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`, 'success');

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  });
}

// ============================================================================
// WISHLIST - Heart Animation
// ============================================================================

function initWishlist() {
  const wishlistBtn = document.getElementById('add-to-wishlist');

  if (!wishlistBtn) return;

  let isWishlisted = false;

  wishlistBtn.addEventListener('click', function() {
    isWishlisted = !isWishlisted;

    const svg = this.querySelector('svg path');
    if (svg) {
      if (isWishlisted) {
        svg.setAttribute('fill', '#ef4444');
        svg.setAttribute('stroke', '#ef4444');
        toast.show('Added to wishlist!', 'success');
      } else {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        toast.show('Removed from wishlist', 'info');
      }
    }

    // Heart beat animation
    this.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 200);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(isWishlisted ? [10, 30, 10] : 10);
    }
  });
}

// ============================================================================
// TABS SYSTEM - Smooth Content Switching
// ============================================================================

function initTabs() {
  const tabs = document.querySelectorAll('.tabs__tab');
  const panels = document.querySelectorAll('.tabs__panel');

  if (tabs.length === 0 || panels.length === 0) return;

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', function() {
      // Remove active state from all tabs and panels
      tabs.forEach(t => {
        t.classList.remove('tabs__tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => {
        p.classList.remove('tabs__panel--active');
      });

      // Add active state to clicked tab and corresponding panel
      this.classList.add('tabs__tab--active');
      this.setAttribute('aria-selected', 'true');
      
      if (panels[index]) {
        // Fade in animation
        panels[index].style.opacity = '0';
        panels[index].style.transform = 'translateY(10px)';
        panels[index].classList.add('tabs__panel--active');
        
        requestAnimationFrame(() => {
          panels[index].style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          panels[index].style.opacity = '1';
          panels[index].style.transform = 'translateY(0)';
        });
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    });
  });

  // Keyboard navigation
  const tabList = document.querySelector('.tabs');
  if (tabList) {
    tabList.addEventListener('keydown', (e) => {
      const currentTab = document.activeElement;
      const currentIndex = Array.from(tabs).indexOf(currentTab);

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        tabs[prevIndex].focus();
        tabs[prevIndex].click();
      }
    });
  }
}

// ============================================================================
// FILTER SYSTEM - Real-time Product Filtering
// ============================================================================

function initFilters() {
  const filterSelects = document.querySelectorAll('.filter-select');
  const searchInput = document.querySelector('.search-input');

  // Filter change handlers
  filterSelects.forEach(select => {
    select.addEventListener('change', function() {
      // Visual feedback
      this.style.transform = 'scale(1.02)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);

      // In a real app, this would filter products
      console.log('Filter changed:', this.value);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    });

    // Add transition
    select.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
  });

  // Search input with debounce
  if (searchInput) {
    const debouncedSearch = Voltage.debounce((value) => {
      console.log('Searching for:', value);
      // In a real app, this would filter products
    }, 300);

    searchInput.addEventListener('input', function(e) {
      debouncedSearch(e.target.value);
    });
  }
}

// ============================================================================
// CART INTERACTIONS - Quantity Updates and Removal
// ============================================================================

function initCartInteractions() {
  // Quantity buttons in cart
  document.querySelectorAll('.cart-item__quantity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Visual feedback
      this.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 100);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    });
  });

  // Remove item buttons
  document.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const cartItem = this.closest('.cart-item');
      if (cartItem) {
        // Slide out animation
        cartItem.style.transform = 'translateX(-20px)';
        cartItem.style.opacity = '0';
        
        setTimeout(() => {
          cartItem.remove();
          toast.show('Item removed from cart', 'info');
        }, 300);
      }
    });
  });
}

// ============================================================================
// PRODUCT CARD INTERACTIONS - Hover and Click Effects
// ============================================================================

function initProductCards() {
  const productCards = document.querySelectorAll('.product-card');

  productCards.forEach(card => {
    // Add to cart from card
    const addBtn = card.querySelector('.btn--primary');
    if (addBtn) {
      addBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const rect = this.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Particle burst
        particles.burst(x, y, '#3c6357', 20);

        // Button feedback
        const originalText = this.innerHTML;
        this.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8L7 11L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Added!';
        this.style.background = '#4ade80';

        setTimeout(() => {
          this.innerHTML = originalText;
          this.style.background = '';
        }, 1500);

        // Update cart badge
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
          const count = parseInt(cartBadge.textContent) || 0;
          cartBadge.textContent = count + 1;
          cartBadge.style.transform = 'scale(1.3)';
          setTimeout(() => {
            cartBadge.style.transform = 'scale(1)';
          }, 200);
        }

        toast.show('Added to cart!', 'success');

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([10, 50, 10]);
        }
      });
    }
  });
}

// ============================================================================
// SCROLL EFFECTS - Reveal on Scroll
// ============================================================================

function initScrollEffects() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe product cards
  document.querySelectorAll('.product-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`;
    observer.observe(card);
  });
}

// ============================================================================
// BUTTON RIPPLE EFFECT - Material Design Inspired
// ============================================================================

function addRippleEffect(button, e) {
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    left: ${x}px;
    top: ${y}px;
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  `;

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

// Add ripple animation to stylesheet
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Apply ripple to all buttons
document.addEventListener('click', (e) => {
  const button = e.target.closest('button, .button, .btn');
  if (button && !button.classList.contains('no-ripple')) {
    addRippleEffect(button, e);
  }
});

// ============================================================================
// INITIALIZATION - Wire Up All Circuits
// ============================================================================

function initializeInteractions() {
  console.log('⚡ Vesper "Surge" Voltage - Powering up interaction circuits...');

  // Product page interactions
  initProductGallery();
  initColorSelector();
  initQuantitySelector();
  initAddToCart();
  initWishlist();
  initTabs();

  // Catalog page interactions
  initFilters();
  initProductCards();
  initScrollEffects();

  // Cart page interactions
  initCartInteractions();

  // Global enhancements
  document.querySelectorAll('button, .button, .btn').forEach(btn => {
    btn.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
  });

  console.log('✓ All circuits live and responsive!');
}

// ============================================================================
// SHOPPING CART CLASS - Global Cart Management
// ============================================================================

class ShoppingCart {
  constructor() {
    this.apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
    this.items = [];
    this.load();
  }

  // Add item to cart
  async add(productId, quantity = 1) {
    try {
      const response = await this.request('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      this.items = response.data.cart.items;
      this.updateCartBadge();
      this.showAddToCartFeedback();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  }

  // Remove item from cart
  async remove(productId) {
    try {
      const response = await this.request(`/cart/items/${productId}`, {
        method: 'DELETE',
      });
      this.items = response.data.cart.items;
      this.updateCartBadge();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    }
  }

  // Update quantity
  async updateQuantity(productId, quantity) {
    try {
      const response = await this.request(`/cart/items/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      this.items = response.data.cart.items;
      this.updateCartBadge();
    } catch (error) {
      console.error('Failed to update item quantity:', error);
    }
  }

  // Get cart total
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Clear cart
  async clear() {
    try {
      await this.request('/cart', { method: 'DELETE' });
      this.items = [];
      this.updateCartBadge();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  }

  // Load cart from API
  async load() {
    try {
      const response = await this.request('/cart');
      this.items = response.data.cart.items;
      this.updateCartBadge();
    } catch (error) {
      console.error('Failed to load cart from API:', error);
    }
  }

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

  // Update cart badge in header
  updateCartBadge() {
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
      const totalItems = this.getTotalItems();
      cartBadge.textContent = totalItems;

      // Animate badge update
      cartBadge.style.transform = 'scale(1.3)';
      setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
      }, 300);
    }
  }

  // Show feedback when item is added
  showAddToCartFeedback() {
    // Use existing toast system if available
    if (window.Voltage && window.Voltage.toast) {
      window.Voltage.toast.show('Added to cart!', 'success');
    }

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  // Get all items
  getItems() {
    return [...this.items];
  }
}

// Make ShoppingCart globally available
window.ShoppingCart = ShoppingCart;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeInteractions);
} else {
  initializeInteractions();
}

// Respect reduced motion preferences
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.style.setProperty('--transition-fast', '0.01ms');
  document.documentElement.style.setProperty('--transition-base', '0.01ms');
  document.documentElement.style.setProperty('--transition-slow', '0.01ms');
}

// Export for external use
window.Voltage = {
  ...Voltage,
  particles,
  toast,
  initializeInteractions
};
