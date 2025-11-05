/**
 * Accessibility and Performance Optimization Module
 * Ensures inclusive design and optimal performance
 * Maintaining zen principles while providing universal access
 */

class AccessibilityManager {
  constructor() {
    this.announcer = this.createScreenReaderAnnouncer();
    this.focusTrapElements = [];
    this.skipLinks = this.createSkipLinks();
    this.keyboardNavigation = new KeyboardNavigationManager();
    this.ariaManager = new AriaManager();
    this.colorContrast = new ColorContrastManager();
    this.init();
  }

  init() {
    this.setupFocusManagement();
    this.setupAnnounceRegions();
    this.setupSkipNavigation();
    this.setupEnhancedAccessibility();
    this.setupReducedMotion();
    this.setupHighContrastMode();
    this.setupKeyboardShortcuts();
    this.setupLiveRegions();
  }

  /**
   * Create screen reader announcer
   */
  createScreenReaderAnnouncer() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);
    return announcer;
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Reset after announcement
    setTimeout(() => {
      this.announcer.textContent = '';
      this.announcer.setAttribute('aria-live', 'polite');
    }, 1000);
  }

  /**
   * Create skip links for keyboard navigation
   */
  createSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;

    skipLinks.style.cssText = `
      position: fixed;
      top: -100px;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      gap: 1rem;
    `;

    // Style skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-link {
        background: var(--color-neutral-900);
        color: var(--color-neutral-0);
        padding: 0.5rem 1rem;
        text-decoration: none;
        border-radius: 0.25rem;
        font-weight: var(--font-weight-semibold);
        transform: translateY(-100px);
        transition: transform 0.3s ease;
      }

      .skip-link:focus {
        transform: translateY(120px);
      }
    `;
    document.head.appendChild(style);

    document.body.insertBefore(skipLinks, document.body.firstChild);
    return skipLinks;
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Add focus indicators
    const focusStyle = document.createElement('style');
    focusStyle.textContent = `
      *:focus {
        outline: 2px solid var(--color-primary-500);
        outline-offset: 2px;
      }

      *:focus:not(:focus-visible) {
        outline: none;
      }

      *:focus-visible {
        outline: 2px solid var(--color-primary-500);
        outline-offset: 2px;
      }

      button:focus,
      a:focus,
      input:focus,
      select:focus,
      textarea:focus {
        outline: 2px solid var(--color-primary-500);
        outline-offset: 2px;
      }

      .focus-trap {
        outline: 2px solid var(--color-error-500);
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(focusStyle);

    // Manage focus for dynamic content
    this.manageFocusForDynamicContent();
  }

  /**
   * Manage focus for dynamically loaded content
   */
  manageFocusForDynamicContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if it's a focusable element that should receive focus
            if (node.classList.contains('auto-focus')) {
              requestAnimationFrame(() => {
                node.focus();
              });
            }

            // Add appropriate ARIA attributes to new elements
            this.ariaManager.enhanceElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup announce regions for dynamic content
   */
  setupAnnounceRegions() {
    // Create status region
    const statusRegion = document.createElement('div');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.id = 'status-region';
    statusRegion.className = 'visually-hidden';
    document.body.appendChild(statusRegion);

    // Create alert region
    const alertRegion = document.createElement('div');
    alertRegion.setAttribute('aria-live', 'assertive');
    alertRegion.setAttribute('aria-atomic', 'true');
    alertRegion.id = 'alert-region';
    alertRegion.className = 'visually-hidden';
    document.body.appendChild(alertRegion);
  }

  /**
   * Setup skip navigation
   */
  setupSkipNavigation() {
    // Add IDs to main sections
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main) main.id = 'main';

    const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    if (nav) nav.id = 'navigation';

    const search = document.querySelector('[role="search"], .search-input');
    if (search) search.id = 'search';
  }

  /**
   * Setup enhanced accessibility for interactive elements
   */
  setupEnhancedAccessibility() {
    // Enhance buttons
    document.querySelectorAll('button').forEach(button => {
      if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
        button.setAttribute('aria-label', 'Button');
      }

      // Add keyboard support for custom buttons
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });

    // Enhance links
    document.querySelectorAll('a').forEach(link => {
      if (link.getAttribute('href') === '#') {
        link.setAttribute('role', 'button');
        link.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            link.click();
          }
        });
      }
    });

    // Enhance form elements
    this.enhanceFormAccessibility();
  }

  /**
   * Enhance form accessibility
   */
  enhanceFormAccessibility() {
    document.querySelectorAll('input, select, textarea').forEach(element => {
      // Ensure labels exist
      const id = element.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label) {
          // Create implicit label if none exists
          if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
            element.setAttribute('aria-label', element.name || element.type);
          }
        }
      }

      // Add required field indicators
      if (element.required) {
        element.setAttribute('aria-required', 'true');
      }

      // Add validation states
      element.addEventListener('invalid', () => {
        element.setAttribute('aria-invalid', 'true');
        this.announce(`${element.name || 'Field'} is invalid`);
      });

      element.addEventListener('input', () => {
        if (element.getAttribute('aria-invalid') === 'true') {
          element.removeAttribute('aria-invalid');
        }
      });
    });
  }

  /**
   * Setup reduced motion support
   */
  setupReducedMotion() {
    // Check user preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyReducedMotion = (reduced) => {
      if (reduced) {
        document.documentElement.style.setProperty('--transition-fast', '0ms');
        document.documentElement.style.setProperty('--transition-base', '0ms');
        document.documentElement.style.setProperty('--transition-slow', '0ms');

        // Disable animations
        const style = document.createElement('style');
        style.id = 'reduced-motion-styles';
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);
      } else {
        // Remove reduced motion styles
        const reducedMotionStyle = document.getElementById('reduced-motion-styles');
        if (reducedMotionStyle) {
          reducedMotionStyle.remove();
        }
      }
    };

    applyReducedMotion(prefersReducedMotion.matches);

    // Listen for changes
    prefersReducedMotion.addEventListener('change', (e) => {
      applyReducedMotion(e.matches);
    });
  }

  /**
   * Setup high contrast mode support
   */
  setupHighContrastMode() {
    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');

    const applyHighContrast = (highContrast) => {
      if (highContrast) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    };

    applyHighContrast(prefersHighContrast.matches);

    // Add keyboard shortcut for high contrast toggle
    document.addEventListener('keydown', (e) => {
      // Alt + H for high contrast toggle
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        document.body.classList.toggle('high-contrast');
        const isActive = document.body.classList.contains('high-contrast');
        this.announce(`High contrast mode ${isActive ? 'enabled' : 'disabled'}`);
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Skip links
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            document.getElementById('search')?.focus();
            break;
          case 'n':
            e.preventDefault();
            document.getElementById('navigation')?.focus();
            break;
          case 'm':
            e.preventDefault();
            document.getElementById('main')?.focus();
            break;
        }
      }

      // Accessibility shortcuts
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            this.announce('Screen reader mode enhanced');
            break;
          case 'c':
            e.preventDefault();
            this.adjustContrast();
            break;
          case 'f':
            e.preventDefault();
            this.adjustFontSize(1);
            break;
          case 'd':
            e.preventDefault();
            this.adjustFontSize(-1);
            break;
        }
      }
    });
  }

  /**
   * Setup live regions for dynamic content
   */
  setupLiveRegions() {
    // Create loading announcer
    const loadingRegion = document.createElement('div');
    loadingRegion.setAttribute('aria-live', 'polite');
    loadingRegion.setAttribute('aria-busy', 'false');
    loadingRegion.id = 'loading-region';
    loadingRegion.className = 'visually-hidden';
    document.body.appendChild(loadingRegion);

    // Monitor for loading states
    const observer = new MutationObserver(() => {
      const loadingElements = document.querySelectorAll('[aria-busy="true"]');
      if (loadingElements.length > 0) {
        loadingRegion.setAttribute('aria-busy', 'true');
        this.announce('Loading content');
      } else {
        loadingRegion.setAttribute('aria-busy', 'false');
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-busy'],
      subtree: true
    });
  }

  /**
   * Trap focus within modal or dialog
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstFocusable.focus();

    // Store for cleanup
    this.focusTrapElements.push({ element, handleKeyDown });
  }

  /**
   * Release focus trap
   */
  releaseFocus(element) {
    const trapIndex = this.focusTrapElements.findIndex(trap => trap.element === element);
    if (trapIndex > -1) {
      const { handleKeyDown } = this.focusTrapElements[trapIndex];
      element.removeEventListener('keydown', handleKeyDown);
      this.focusTrapElements.splice(trapIndex, 1);
    }
  }

  /**
   * Adjust font size for better readability
   */
  adjustFontSize(delta) {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const newSize = Math.max(12, Math.min(24, currentSize + delta));
    document.documentElement.style.fontSize = `${newSize}px`;
    this.announce(`Font size ${newSize} pixels`);
  }

  /**
   * Adjust contrast
   */
  adjustContrast() {
    document.body.classList.toggle('enhanced-contrast');
    const isActive = document.body.classList.contains('enhanced-contrast');
    this.announce(`Enhanced contrast ${isActive ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check color contrast
   */
  checkColorContrast(element) {
    const styles = getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Simple contrast check (would use proper library in production)
    const contrast = this.colorContrast.calculate(color, backgroundColor);

    if (contrast < 4.5) {
      console.warn(`Low contrast detected: ${contrast}:1`, element);
      return false;
    }

    return true;
  }

  /**
   * Add accessibility testing utilities
   */
  testAccessibility() {
    const issues = [];

    // Check for alt text
    document.querySelectorAll('img').forEach((img, index) => {
      if (!img.alt && !img.getAttribute('role')) {
        issues.push(`Image ${index + 1} missing alt text`);
      }
    });

    // Check for form labels
    document.querySelectorAll('input, select, textarea').forEach((input, index) => {
      const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');

      if (!hasLabel && !hasAriaLabel) {
        issues.push(`Form input ${index + 1} missing label`);
      }
    });

    // Check heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName.substring(1));
      if (currentLevel > previousLevel + 1) {
        issues.push(`Heading level skipped: h${previousLevel} to h${currentLevel}`);
      }
      previousLevel = currentLevel;
    });

    // Check for focusable elements
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      issues.push('No focusable elements found');
    }

    // Report issues
    if (issues.length > 0) {
      console.group('Accessibility Issues Found:');
      issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    } else {
      console.log('✅ No accessibility issues found');
    }

    return issues;
  }
}

/**
 * Keyboard Navigation Manager
 */
class KeyboardNavigationManager {
  constructor() {
    this.setupKeyboardNavigation();
  }

  setupKeyboardNavigation() {
    // Enhanced menu navigation
    this.setupMenuNavigation();

    // Grid navigation
    this.setupGridNavigation();

    // Carousel navigation
    this.setupCarouselNavigation();
  }

  setupMenuNavigation() {
    document.querySelectorAll('[role="menu"]').forEach(menu => {
      const menuItems = menu.querySelectorAll('[role="menuitem"]');

      menuItems.forEach((item, index) => {
        item.addEventListener('keydown', (e) => {
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              const nextItem = menuItems[index + 1] || menuItems[0];
              nextItem.focus();
              break;
            case 'ArrowUp':
              e.preventDefault();
              const prevItem = menuItems[index - 1] || menuItems[menuItems.length - 1];
              prevItem.focus();
              break;
            case 'Home':
              e.preventDefault();
              menuItems[0].focus();
              break;
            case 'End':
              e.preventDefault();
              menuItems[menuItems.length - 1].focus();
              break;
            case 'Escape':
              e.preventDefault();
              menu.setAttribute('aria-hidden', 'true');
              menu.previousElementSibling?.focus();
              break;
          }
        });
      });
    });
  }

  setupGridNavigation() {
    document.querySelectorAll('[role="grid"]').forEach(grid => {
      const cells = grid.querySelectorAll('[role="gridcell"]');
      const cols = Math.floor(Math.sqrt(cells.length)); // Assume square grid

      grid.addEventListener('keydown', (e) => {
        const currentCell = document.activeElement;
        const currentIndex = Array.from(cells).indexOf(currentCell);

        if (currentIndex === -1) return;

        let newIndex = currentIndex;
        const currentRow = Math.floor(currentIndex / cols);
        const currentCol = currentIndex % cols;

        switch (e.key) {
          case 'ArrowRight':
            newIndex = Math.min(currentIndex + 1, currentRow * cols + cols - 1);
            break;
          case 'ArrowLeft':
            newIndex = Math.max(currentRow * cols, currentIndex - 1);
            break;
          case 'ArrowDown':
            newIndex = Math.min(currentIndex + cols, cells.length - 1);
            break;
          case 'ArrowUp':
            newIndex = Math.max(currentIndex - cols, currentCol);
            break;
          default:
            return;
        }

        e.preventDefault();
        cells[newIndex].focus();
      });
    });
  }

  setupCarouselNavigation() {
    document.querySelectorAll('.carousel').forEach(carousel => {
      const items = carousel.querySelectorAll('.carousel__item');

      carousel.addEventListener('keydown', (e) => {
        const currentItem = carousel.querySelector('.carousel__item:focus');
        const currentIndex = Array.from(items).indexOf(currentItem);

        if (currentIndex === -1) return;

        let newIndex = currentIndex;

        switch (e.key) {
          case 'ArrowLeft':
            newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            break;
          case 'ArrowRight':
            newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            break;
          default:
            return;
        }

        e.preventDefault();
        items[newIndex].focus();
      });
    });
  }
}

/**
 * ARIA Manager
 */
class AriaManager {
  enhanceElement(element) {
    // Add appropriate ARIA attributes based on element type
    if (element.tagName === 'BUTTON' && !element.getAttribute('type')) {
      element.setAttribute('type', 'button');
    }

    // Add live regions for dynamic content
    if (element.classList.contains('dynamic-content')) {
      element.setAttribute('aria-live', 'polite');
    }

    // Add labels for icon-only buttons
    if (element.tagName === 'BUTTON' && !element.textContent.trim() && !element.getAttribute('aria-label')) {
      const icon = element.querySelector('svg');
      if (icon) {
        // Use aria-label from parent or generate based on context
        const label = element.getAttribute('title') || 'Button';
        element.setAttribute('aria-label', label);
      }
    }

    // Add landmarks for main sections
    if (element.tagName === 'MAIN') {
      element.setAttribute('role', 'main');
    }
    if (element.tagName === 'ASIDE') {
      element.setAttribute('role', 'complementary');
    }
  }
}

/**
 * Color Contrast Manager
 */
class ColorContrastManager {
  calculate(color1, color2) {
    // Simplified contrast calculation
    // In production, use a proper library like chroma.js
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const l1 = this.relativeLuminance(rgb1);
    const l2 = this.relativeLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  hexToRgb(hex) {
    // Convert hex to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  relativeLuminance(rgb) {
    // Calculate relative luminance
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}

/**
 * Performance Optimization Manager
 */
class PerformanceManager {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.init();
  }

  init() {
    this.setupPerformanceMonitoring();
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.setupCodeSplitting();
    this.setupCacheStrategy();
    this.setupResourceHints();
  }

  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();

    // Monitor custom metrics
    this.monitorPageLoad();
    this.monitorUserInteractions();
  }

  observeLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('LCP', lastEntry.renderTime || lastEntry.loadTime);

      // Report LCP if it's poor
      if (this.metrics.get('LCP') > 2500) {
        console.warn('Poor LCP detected:', this.metrics.get('LCP'));
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }

  observeFID() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        this.metrics.set('FID', entry.processingStart - entry.startTime);

        // Report FID if it's poor
        if (this.metrics.get('FID') > 100) {
          console.warn('Poor FID detected:', this.metrics.get('FID'));
        }
      });
    }).observe({ entryTypes: ['first-input'] });
  }

  observeCLS() {
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.set('CLS', clsValue);
        }
      }

      // Report CLS if it's poor
      if (clsValue > 0.1) {
        console.warn('Poor CLS detected:', clsValue);
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  monitorPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.metrics.set('PageLoad', loadTime);

      // Report to analytics
      this.reportMetrics();
    });
  }

  monitorUserInteractions() {
    let interactionCount = 0;

    document.addEventListener('click', () => {
      interactionCount++;
      this.metrics.set('UserInteractions', interactionCount);
    });

    // Track time to first interaction
    const timeToFirstClick = Date.now() - performance.timing.navigationStart;
    this.metrics.set('TimeToFirstClick', timeToFirstClick);
  }

  setupLazyLoading() {
    // Image lazy loading with Intersection Observer
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;

          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    this.observers.push(imageObserver);
  }

  setupImageOptimization() {
    // Add responsive images
    document.querySelectorAll('img').forEach(img => {
      if (!img.srcset && img.src) {
        // Generate srcset for responsive images
        const baseUrl = img.src.split('?')[0];
        const ext = baseUrl.split('.').pop();

        // Example sizes - adjust based on your image CDN
        img.srcset = `
          ${baseUrl}?w=400 ${400}w,
          ${baseUrl}?w=800 ${800}w,
          ${baseUrl}?w=1200 ${1200}w,
          ${baseUrl}?w=1600 ${1600}w
        `.trim();

        img.sizes = '(max-width: 480px) 400px, (max-width: 768px) 800px, (max-width: 1024px) 1200px, 1600px';
      }
    });

    // Add WebP support detection
    this.addWebPSupport();
  }

  addWebPSupport() {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      const isSupported = webP.height === 2;

      if (isSupported) {
        document.querySelectorAll('img').forEach(img => {
          if (img.src.includes('.jpg') || img.src.includes('.png')) {
            const webpUrl = img.src.replace(/\.(jpg|png)$/, '.webp');

            // Test if WebP version exists
            const testImg = new Image();
            testImg.onload = () => {
              img.src = webpUrl;
            };
            testImg.src = webpUrl;
          }
        });
      }
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }

  setupCodeSplitting() {
    // Dynamic import for non-critical JavaScript
    const loadNonCriticalJS = () => {
      import('./enhanced-interactions.js').then(module => {
        module.initEnhancedFeatures();
      }).catch(error => {
        console.warn('Failed to load enhanced interactions:', error);
      });
    };

    // Load after initial page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadNonCriticalJS);
    } else {
      setTimeout(loadNonCriticalJS, 100);
    }
  }

  setupCacheStrategy() {
    // Service Worker registration for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.warn('Service Worker registration failed:', error);
        });
    }

    // Setup localStorage cache for API responses
    this.setupAPICache();
  }

  setupAPICache() {
    const cache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    window.cachedFetch = async (url, options = {}) => {
      const cacheKey = `${url}:${JSON.stringify(options)}`;
      const cached = cache.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.response;
      }

      try {
        const response = await fetch(url, options);
        cache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now()
        });
        return response;
      } catch (error) {
        if (cached) {
          console.warn('Network error, using cached response:', error);
          return cached.response;
        }
        throw error;
      }
    };
  }

  setupResourceHints() {
    // Preload critical resources
    const preloadResources = [
      { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { href: '/css/critical.css', as: 'style' }
    ];

    preloadResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.assign(link, resource);
      document.head.appendChild(link);
    });

    // Prefetch likely next pages
    const likelyNextPages = ['/catalog.html', '/checkout.html'];
    likelyNextPages.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });

    // DNS prefetch for external domains
    const externalDomains = ['https://images.unsplash.com', 'https://fonts.googleapis.com'];
    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  reportMetrics() {
    // Report to analytics service
    if (window.gtag) {
      Object.entries(this.metrics).forEach(([metric, value]) => {
        window.gtag('event', metric, {
          value: Math.round(value),
          non_interaction: true
        });
      });
    }

    // Report to console for development
    console.group('Performance Metrics:');
    Object.entries(this.metrics).forEach(([metric, value]) => {
      console.log(`${metric}: ${value}`);
    });
    console.groupEnd();
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

/**
 * Initialize and export
 */
const accessibilityManager = new AccessibilityManager();
const performanceManager = new PerformanceManager();

// Make available globally
window.AccessibilityManager = AccessibilityManager;
window.accessibilityManager = accessibilityManager;
window.PerformanceManager = PerformanceManager;
window.performanceManager = performanceManager;

// Export for ES modules
export { AccessibilityManager, PerformanceManager, accessibilityManager, performanceManager };