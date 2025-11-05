/**
 * Settings Model
 * Pipeline Rivers - Admin settings data access layer
 */

const { db } = require('../config/database');

class Settings {
  /**
   * Get all settings
   */
  static get() {
    const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get();

    if (!settings) {
      return this.getDefaults();
    }

    return {
      display: {
        productsPerPage: settings.display_products_per_page,
        showImages: Boolean(settings.display_show_images),
        showStock: Boolean(settings.display_show_stock),
        showDescriptions: Boolean(settings.display_show_descriptions),
        compactView: Boolean(settings.display_compact_view)
      },
      alerts: {
        lowStockThreshold: settings.alerts_low_stock_threshold,
        emailOnLowStock: Boolean(settings.alerts_email_on_low_stock),
        emailOnOutOfStock: Boolean(settings.alerts_email_on_out_of_stock),
        notificationEmail: settings.alerts_notification_email
      },
      sorting: {
        defaultSort: settings.sorting_default_sort,
        defaultOrder: settings.sorting_default_order
      }
    };
  }

  /**
   * Update settings
   */
  static update(data) {
    const updates = [];
    const params = [];

    if (data.display) {
      if (data.display.productsPerPage !== undefined) {
        updates.push('display_products_per_page = ?');
        params.push(data.display.productsPerPage);
      }
      if (data.display.showImages !== undefined) {
        updates.push('display_show_images = ?');
        params.push(data.display.showImages ? 1 : 0);
      }
      if (data.display.showStock !== undefined) {
        updates.push('display_show_stock = ?');
        params.push(data.display.showStock ? 1 : 0);
      }
      if (data.display.showDescriptions !== undefined) {
        updates.push('display_show_descriptions = ?');
        params.push(data.display.showDescriptions ? 1 : 0);
      }
      if (data.display.compactView !== undefined) {
        updates.push('display_compact_view = ?');
        params.push(data.display.compactView ? 1 : 0);
      }
    }

    if (data.alerts) {
      if (data.alerts.lowStockThreshold !== undefined) {
        updates.push('alerts_low_stock_threshold = ?');
        params.push(data.alerts.lowStockThreshold);
      }
      if (data.alerts.emailOnLowStock !== undefined) {
        updates.push('alerts_email_on_low_stock = ?');
        params.push(data.alerts.emailOnLowStock ? 1 : 0);
      }
      if (data.alerts.emailOnOutOfStock !== undefined) {
        updates.push('alerts_email_on_out_of_stock = ?');
        params.push(data.alerts.emailOnOutOfStock ? 1 : 0);
      }
      if (data.alerts.notificationEmail !== undefined) {
        updates.push('alerts_notification_email = ?');
        params.push(data.alerts.notificationEmail);
      }
    }

    if (data.sorting) {
      if (data.sorting.defaultSort !== undefined) {
        updates.push('sorting_default_sort = ?');
        params.push(data.sorting.defaultSort);
      }
      if (data.sorting.defaultOrder !== undefined) {
        updates.push('sorting_default_order = ?');
        params.push(data.sorting.defaultOrder);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime(\'now\')');
      
      const stmt = db.prepare(`
        UPDATE admin_settings
        SET ${updates.join(', ')}
        WHERE id = 1
      `);

      stmt.run(...params);
    }

    return this.get();
  }

  /**
   * Get default settings
   */
  static getDefaults() {
    return {
      display: {
        productsPerPage: 25,
        showImages: true,
        showStock: true,
        showDescriptions: false,
        compactView: false
      },
      alerts: {
        lowStockThreshold: 20,
        emailOnLowStock: true,
        emailOnOutOfStock: true,
        notificationEmail: null
      },
      sorting: {
        defaultSort: 'name',
        defaultOrder: 'asc'
      }
    };
  }
}

module.exports = Settings;
