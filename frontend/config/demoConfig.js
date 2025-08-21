// demoConfig.js - Centralized demo mode configuration
export const DEMO_MODES = {
  FULL_DEMO: "full_demo",
  DATA_SOURCES_ONLY: "data_sources_only",
  AUTHENTICATION_ONLY: "auth_only",
  DISABLED: "disabled",
};

export const DEFAULT_DEMO_CONFIG = {
  // Global demo mode setting
  mode: DEMO_MODES.FULL_DEMO,

  // Individual component demo settings
  components: {
    authentication: true, // Use demo auth instead of real backend
    // dataSources may be either a boolean (legacy/global toggle) or an object map of type->boolean
    // default here: enable demo for common types, but disable for "custom-api" (API sources)
    dataSources: {
      "custom-api": false,
      "google-sheets": true,
      "microsoft-excel": true,
      database: true,
      "csv-file": true,
      "google-drive": true,
      onedrive: true,
      dropbox: true,
    },
    apiConnections: true, // Use mock API responses
    fileStorage: true, // Use in-memory storage instead of backend
  },

  // Demo behavior settings
  behavior: {
    simulateNetworkDelay: true, // Add realistic delays
    simulateErrors: true, // Occasionally simulate errors
    persistDemoData: false, // Keep demo data between sessions
    showDemoIndicators: true, // Show "Demo Mode" badges in UI
    allowRealDataMixing: false, // Allow mixing real and demo data
  },

  // Demo data settings
  data: {
    useRealTimestamps: true, // Use current timestamps in demo data
    generateRandomIds: true, // Generate new IDs each session
    includeErrorStates: true, // Include sources with error status
    sourceCount: 3, // Number of demo data sources
  },

  // Fallback settings
  fallback: {
    enableOnAuthFailure: true, // Auto-enable demo on auth failure
    enableOnApiFailure: true, // Auto-enable demo on API failure
    notifyUserOnFallback: true, // Show notification when falling back
  },
};

export class DemoConfigManager {
  constructor(initialConfig = DEFAULT_DEMO_CONFIG) {
    this.config = { ...initialConfig };
    this.listeners = new Set();
  }

  // Get current demo configuration
  getConfig() {
    return { ...this.config };
  }

  // Update demo configuration
  updateConfig(updates) {
    const oldConfig = { ...this.config };

    // Prevent re-entrant notifications: if an update is triggered while we are
    // already notifying listeners, absorb the update into the current config
    // without recursively notifying listeners again which can cause stack overflows.
    if (this._notifying) {
      // merge as usual but do not notify listeners now
      const merged = { ...this.config, ...updates };
      merged.components = {
        ...this.config.components,
        ...(updates.components || {}),
      };
      merged.behavior = {
        ...this.config.behavior,
        ...(updates.behavior || {}),
      };
      merged.data = { ...this.config.data, ...(updates.data || {}) };
      merged.fallback = {
        ...this.config.fallback,
        ...(updates.fallback || {}),
      };
      this.config = merged;
      return this.config;
    }

    // Merge top-level config, but treat nested objects carefully to preserve
    // the ability for `components.dataSources` to be either boolean or object map.
    const newConfig = { ...this.config, ...updates };

    // Merge components
    newConfig.components = {
      ...this.config.components,
      ...(updates.components || {}),
    };

    // If dataSources was provided and both old and updates are objects, merge their keys
    const oldDS = this.config.components && this.config.components.dataSources;
    const newDSUpdate = updates.components && updates.components.dataSources;
    if (
      newDSUpdate !== undefined &&
      typeof oldDS === "object" &&
      oldDS !== null &&
      typeof newDSUpdate === "object" &&
      newDSUpdate !== null
    ) {
      newConfig.components.dataSources = { ...oldDS, ...newDSUpdate };
    }

    // Merge other nested groups
    newConfig.behavior = {
      ...this.config.behavior,
      ...(updates.behavior || {}),
    };
    newConfig.data = { ...this.config.data, ...(updates.data || {}) };
    newConfig.fallback = {
      ...this.config.fallback,
      ...(updates.fallback || {}),
    };

    this.config = newConfig;

    // Notify listeners of configuration changes. Guard against re-entrant
    // listener-triggered updates by setting a flag while notifying.
    this._notifying = true;
    try {
      this.listeners.forEach((listener) => {
        try {
          listener(this.config, oldConfig);
        } catch (error) {
          console.error("Demo config listener error:", error);
        }
      });
    } finally {
      this._notifying = false;
    }

    return this.config;
  }

  // Set demo mode (updates relevant component settings)
  setMode(mode) {
    const modeConfigs = {
      [DEMO_MODES.FULL_DEMO]: {
        mode,
        components: {
          authentication: true,
          dataSources: true,
          apiConnections: true,
          fileStorage: true,
        },
      },
      [DEMO_MODES.DATA_SOURCES_ONLY]: {
        mode,
        components: {
          authentication: false,
          dataSources: true,
          apiConnections: true,
          fileStorage: false,
        },
      },
      [DEMO_MODES.AUTHENTICATION_ONLY]: {
        mode,
        components: {
          authentication: true,
          dataSources: false,
          apiConnections: false,
          fileStorage: false,
        },
      },
      [DEMO_MODES.DISABLED]: {
        mode,
        components: {
          authentication: false,
          dataSources: false,
          apiConnections: false,
          fileStorage: false,
        },
      },
    };

    const config = modeConfigs[mode];
    if (config) {
      return this.updateConfig(config);
    } else {
      console.warn("Unknown demo mode:", mode);
      return this.config;
    }
  }

  // Enable/disable specific component demo mode
  setComponentDemo(component, enabled) {
    // Backwards compatible: if toggling dataSources and a consumer passes an object
    // we want to allow setting an object map of type->boolean. For booleans we
    // simply set the flag.
    const current = this.config.components && this.config.components[component];
    // If no-op, return current config to avoid re-notifying listeners
    if (component === "dataSources") {
      // If current is an object map of per-type flags, preserve the map shape
      // when callers pass a boolean. This avoids accidentally replacing the
      // map with a global boolean and losing per-type config.
      if (typeof enabled === "boolean") {
        if (typeof current === "object" && current !== null) {
          // Create a new map with same keys but set to the boolean value
          const newMap = Object.keys(current).reduce((acc, k) => {
            acc[k] = !!enabled;
            return acc;
          }, {});
          // shallow compare
          const keys = new Set([
            ...Object.keys(current),
            ...Object.keys(newMap),
          ]);
          let changed = false;
          for (const k of keys) {
            if (current[k] !== newMap[k]) {
              changed = true;
              break;
            }
          }
          if (!changed) return this.config;
          return this.updateConfig({ components: { dataSources: newMap } });
        }
        if (current === enabled) return this.config;
        return this.updateConfig({ components: { dataSources: enabled } });
      }
      if (typeof enabled === "object" && enabled !== null) {
        const currMap =
          typeof current === "object" && current !== null ? { ...current } : {};
        const merged = { ...currMap, ...enabled };
        // shallow compare
        const keys = new Set([...Object.keys(currMap), ...Object.keys(merged)]);
        let changed = false;
        for (const k of keys) {
          if (currMap[k] !== merged[k]) {
            changed = true;
            break;
          }
        }
        if (!changed) return this.config;
        return this.updateConfig({ components: { dataSources: merged } });
      }
    }

    if (current === enabled) return this.config;
    return this.updateConfig({ components: { [component]: enabled } });
  }

  // Enable/disable demo for a specific data source type (e.g. 'google-sheets')
  setDataSourceDemo(type, enabled) {
    const current =
      this.config.components && this.config.components.dataSources;
    const map =
      typeof current === "object" && current !== null ? { ...current } : {};
    map[type] = !!enabled;
    return this.updateConfig({ components: { dataSources: map } });
  }

  // Check if a specific data source type is in demo mode. If components.dataSources is
  // a boolean we return that boolean (global toggle). If it's an object map we return
  // the type-specific flag (defaulting to false).
  isDataSourceTypeInDemo(type) {
    const ds = this.config.components && this.config.components.dataSources;
    if (typeof ds === "boolean") return ds;
    if (ds && typeof ds === "object") return !!ds[type];
    return false;
  }

  // Check if a specific component is in demo mode
  isComponentInDemo(component) {
    // Special-case dataSources: if it's an object map we treat the component as
    // in demo if any type is enabled.
    const val = this.config.components[component];
    if (component === "dataSources") {
      if (typeof val === "boolean") return val === true;
      if (val && typeof val === "object")
        return Object.values(val).some((v) => v === true);
      return false;
    }
    return val === true;
  }

  // Check if any demo mode is active
  isDemoActive() {
    return (
      this.config.mode !== DEMO_MODES.DISABLED &&
      Object.values(this.config.components).some((enabled) => enabled)
    );
  }

  // Get demo status for UI display
  getDemoStatus() {
    const activeComponents = Object.entries(this.config.components).reduce(
      (acc, [component, enabled]) => {
        if (component === "dataSources") {
          if (typeof enabled === "boolean") {
            if (enabled) acc.push("dataSources");
          } else if (enabled && typeof enabled === "object") {
            const activeTypes = Object.entries(enabled)
              .filter(([t, v]) => v)
              .map(([t]) => t);
            if (activeTypes.length) acc.push({ dataSources: activeTypes });
          }
        } else if (enabled) {
          acc.push(component);
        }
        return acc;
      },
      []
    );

    return {
      mode: this.config.mode,
      isActive: this.isDemoActive(),
      activeComponents,
      showIndicators: this.config.behavior.showDemoIndicators,
    };
  }

  // Add configuration change listener
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Reset to default configuration
  reset() {
    return this.updateConfig(DEFAULT_DEMO_CONFIG);
  }

  // Create a scoped configuration for a specific component
  getScopedConfig(component) {
    const base = {
      isDemo: this.isComponentInDemo(component),
      behavior: this.config.behavior,
      data: this.config.data,
      fallback: this.config.fallback,
      global: this.config,
    };
    if (component === "dataSources") {
      base.dataSources = this.config.components.dataSources;
    }
    return base;
  }
}

// Global demo config manager instance
export const demoConfigManager = new DemoConfigManager();
