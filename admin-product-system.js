
// Admin-specific product management system
async function loadAdminProducts() {
  try {
    const response = await fetch('/api/admin/products');
    const result = await response.json();
    if (result.success) {
      productManagement.products = result.data.products;
      updateProductsTable();
      updateProductStats();
    }
  } catch (error) {
    console.error('Failed to load admin products:', error);
  }
}

async function loadAdminCategories() {
  try {
    const response = await fetch('/api/admin/categories');
    const result = await response.json();
    if (result.success) {
      productManagement.categories = result.data;
      populateCategorySelect();
    }
  } catch (error) {
    console.error('Failed to load admin categories:', error);
  }
}

// Replace the initializeProductManagement function
async function initializeProductManagement() {
  try {
    await loadAdminCategories();
    await loadAdminProducts();
    setupProductFormListeners();
    setupModalHandlers();
    console.log('Admin product management system initialized');
  } catch (error) {
    console.error('Failed to initialize admin product management:', error);
    showToast('Failed to initialize admin product management system', 'error');
  }
}
