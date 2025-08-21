// Simplified demoConfig manager
export const DEFAULT_DEMO_CONFIG = {
  components: {
    authentication: true,
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
    apiConnections: true,
    fileStorage: true,
  },
  behavior: {
    simulateNetworkDelay: true,
    simulateErrors: true,
    persistDemoData: false,
    showDemoIndicators: true,
  },
  data: {
    useRealTimestamps: true,
    generateRandomIds: true,
    includeErrorStates: true,
    sourceCount: 3,
  },
  fallback: {
    enableOnAuthFailure: true,
    enableOnApiFailure: true,
    notifyUserOnFallback: true,
  },
};

class DemoConfigManager {
  constructor(initial = DEFAULT_DEMO_CONFIG) {
    this.config = JSON.parse(JSON.stringify(initial));
    this.listeners = new Set();
  }

  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }

  setGlobalDataSources(enabled) {
    const old = this.getConfig();
    const newMap = Object.keys(this.config.components.dataSources || {}).reduce(
      (acc, k) => {
        acc[k] = !!enabled;
        return acc;
      },
      {}
    );
    this.config.components.dataSources = newMap;
    this._notify(this.getConfig(), old);
    return this.getConfig();
  }

  setDataSourceDemo(type, enabled) {
    if (!this.config.components) this.config.components = {};
    if (
      !this.config.components.dataSources ||
      typeof this.config.components.dataSources !== "object"
    ) {
      this.config.components.dataSources = {};
    }
    const old = this.getConfig();
    const prev = this.config.components.dataSources[type];
    this.config.components.dataSources[type] = !!enabled;
    if (prev !== this.config.components.dataSources[type])
      this._notify(this.getConfig(), old);
    return this.getConfig();
  }

  isDataSourceTypeInDemo(type) {
    const map = this.config.components && this.config.components.dataSources;
    if (!map || typeof map !== "object") return false;
    return !!map[type];
  }

  getScopedConfig(component) {
    const base = {
      isDemo: false,
      behavior: this.config.behavior,
      data: this.config.data,
      fallback: this.config.fallback,
      global: this.getConfig(),
    };
    if (component === "apiConnections") {
      base.isDemo = !!this.config.components.apiConnections;
    }
    if (component === "dataSources") {
      base.isDemo = Object.values(
        this.config.components.dataSources || {}
      ).some(Boolean);
      base.dataSources = { ...this.config.components.dataSources };
    }
    return base;
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify(newConfig, oldConfig = null) {
    // newConfig is expected to be a fresh snapshot (result of getConfig())
    const snapshot = newConfig || this.getConfig();
    for (const l of Array.from(this.listeners)) {
      try {
        // Provide both new and old configs for listeners that need to diff
        l(snapshot, oldConfig);
      } catch (e) {
        console.error("demoConfig listener failed", e);
      }
    }
  }

  // Convenience public API for updating arbitrary parts of the config
  updateBehavior(updates = {}) {
    const old = this.getConfig();
    this.config.behavior = { ...this.config.behavior, ...updates };
    this._notify(this.getConfig(), old);
    return this.getConfig();
  }

  updateData(updates = {}) {
    const old = this.getConfig();
    this.config.data = { ...this.config.data, ...updates };
    this._notify(this.getConfig(), old);
    return this.getConfig();
  }

  setConfig(newConfig = {}) {
    const old = this.getConfig();
    this.config = JSON.parse(JSON.stringify(newConfig));
    this._notify(this.getConfig(), old);
    return this.getConfig();
  }

  reset() {
    const old = this.getConfig();
    this.config = JSON.parse(JSON.stringify(DEFAULT_DEMO_CONFIG));
    this._notify(this.getConfig(), old);
    return this.getConfig();
  }

  // Convenience: is any demo active for the given component (or overall)
  isDemoActive(component = null) {
    try {
      if (!component) {
        const cfg = this.getConfig();
        return Object.values(cfg.components || {}).some((v) =>
          typeof v === "boolean" ? v : Object.values(v || {}).some(Boolean)
        );
      }
      const scoped = this.getScopedConfig(component);
      return !!scoped.isDemo;
    } catch (e) {
      return false;
    }
  }
}

export const demoConfigManager = new DemoConfigManager();
