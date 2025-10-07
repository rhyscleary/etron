// saw somewhere ur not suppised to use switch statements for factory in react native
// should i be using classes here and in the adapters?
import { createGoogleSheetsAdapter } from "./googleSheetsAdapter";
import { createExcelAdapter } from "./excelAdapter";
import { createCustomApiAdapter } from "./apiAdapter";
import { createCustomFtpAdapter } from "./ftpAdapter";
import { createMySqlAdapter } from "./mySqlAdapter";

// supported adapters with their config
const getSupportedTypes = () => [
  {
    type: "local-csv",
    name: "Local CSV",
    icon: "file",
    description: "Upload a local CSV from the device",
    requiresAuth: false,
    supportsRealtime: false,
    supportedOperations: ["read"],
    category: "file",
    ui: {
      displayName: "Local CSV",
      categoryDisplayName: "Files",
      route: "/modules/day-book/data-management/data-connection-inputs/local-csv",
      sortOrder: 0,
      isEnabled: true,
      helpText: "Upload a CSV file from your device",
      requirements: ["CSV file"],
    }
  },
  {
    type: "google-sheets",
    name: "Google Sheets",
    icon: "google-spreadsheet",
    description: "Connect to Google Sheets via Google Drive API",
    requiresAuth: true,
    supportsRealtime: false,
    supportedOperations: ["read"],
    category: "cloud-storage",
    ui: {
      displayName: "Google Sheets",
      categoryDisplayName: "Spreadsheets",
      route:
        "/modules/day-book/data-management/data-connection-inputs/google",
      sortOrder: 1,
      isEnabled: true,
      helpText: "Import data directly from your Google Sheets",
      requirements: ["Google account with access to the sheet"],
    },
  },
  {
    type: "microsoft-excel",
    name: "Microsoft Excel",
    icon: "microsoft-excel",
    description: "Connect to Excel files via Microsoft Graph API",
    requiresAuth: true,
    supportsRealtime: false,
    supportedOperations: ["read"],
    category: "cloud-storage",
    supportedFileTypes: [".xlsx", ".xls"],
    supportedLocations: ["OneDrive", "SharePoint"],
    ui: {
      displayName: "Microsoft Excel",
      categoryDisplayName: "Spreadsheets",
      route: "/modules/day-book/data-management/data-connection-inputs/excel",
      sortOrder: 2,
      isEnabled: true,
      helpText: "Connect to Excel files in OneDrive or SharePoint",
      requirements: ["Microsoft account", "Access to OneDrive or SharePoint"],
    },
  },
  {
    type: "custom-api",
    name: "Custom API",
    icon: "web",
    description: "Connect to a custom REST API endpoint",
    requiresAuth: false,
    supportsRealtime: true,
    supportedOperations: ["read", "write"],
    category: "api",
    ui: {
      displayName: "Custom API",
      categoryDisplayName: "Custom APIs",
      route:
        "/modules/day-book/data-management/data-connection-inputs/custom-API",
      sortOrder: 1,
      isEnabled: true,
      helpText: "Connect to any REST API endpoint",
      requirements: ["API endpoint URL", "Optional: API key or authentication"],
    },
  },
  {
    type: "custom-ftp",
    name: "Custom FTP",
    icon: "server",
    description: "Connect to FTP/SFTP servers for file access",
    requiresAuth: true,
    supportsRealtime: false,
    supportedOperations: ["read", "write"],
    category: "api",
    ui: {
      displayName: "Custom FTP",
      categoryDisplayName: "File Transfer",
      route:
        "/modules/day-book/data-management/data-connection-inputs/custom-FTP",
      sortOrder: 2,
      isEnabled: true,
      helpText: "Access files from FTP or SFTP servers",
      requirements: ["FTP server credentials", "Server address and port"],
    },
  },
  {
    type: "mysql",
    name: "MySql",
    icon: "database",
    description: "Connect to MySQL databases",
    requiresAuth: true,
    supportsRealtime: false,
    supportedOperations: ["read", "write"],
    category: "database",
    ui: {
      displayName: "MySQL",
      categoryDisplayName: "Databases",
      route: "/modules/day-book/data-management/data-connection-inputs/MySQL",
      sortOrder: 1,
      isEnabled: true,
      helpText: "Connect directly to MySQL databases",
      requirements: [
        "Database credentials",
        "Server host and port",
        "Database name",
      ],
    },
  },
];

const getAdapterInfo = (type) => {
  return getSupportedTypes().find((adapter) => adapter.type === type);
};

const isTypeSupported = (type) => {
  return getSupportedTypes().some((adapter) => adapter.type === type);
};

const getAdaptersByCategory = (category) => {
  return getSupportedTypes().filter((adapter) => adapter.category === category);
};

const getAdaptersWithOperation = (operation) => {
  return getSupportedTypes().filter((adapter) =>
    adapter.supportedOperations.includes(operation)
  );
};

const getEnabledAdapters = () => {
  return getSupportedTypes().filter(
    (adapter) => adapter.ui?.isEnabled !== false
  );
};

const getAdaptersWithRoutes = () => {
  return getSupportedTypes().filter((adapter) => adapter.ui?.route);
};

const getAdapterRoute = (type) => {
  const adapter = getAdapterInfo(type);
  return adapter?.ui?.route;
};

const getCategoryDisplayName = (category) => {
  const adapter = getSupportedTypes().find((a) => a.category === category);
  return adapter?.ui?.categoryDisplayName || category;
};

const getAdaptersForUI = (options = {}) => {
  const {
    filterByOperation = null,
    filterByAuth = null,
    excludeCategories = [],
    onlyIncludeCategories = null,
    enabledOnly = true,
    sortByOrder = true,
  } = options;

  let adapters = enabledOnly ? getEnabledAdapters() : getSupportedTypes();

  if (filterByOperation) {
    adapters = adapters.filter((adapter) =>
      adapter.supportedOperations.includes(filterByOperation)
    );
  }

  if (filterByAuth !== null) {
    adapters = adapters.filter(
      (adapter) => adapter.requiresAuth === filterByAuth
    );
  }

  if (onlyIncludeCategories) {
    adapters = adapters.filter((adapter) =>
      onlyIncludeCategories.includes(adapter.category)
    );
  }

  if (excludeCategories.length > 0) {
    adapters = adapters.filter(
      (adapter) => !excludeCategories.includes(adapter.category)
    );
  }

  adapters = adapters.filter((adapter) => adapter.ui?.route);

  const categorizedAdapters = {};

  adapters.forEach((adapter) => {
    const category = adapter.category;
    if (!categorizedAdapters[category]) {
      categorizedAdapters[category] = [];
    }
    categorizedAdapters[category].push(adapter);
  });

  if (sortByOrder) {
    Object.keys(categorizedAdapters).forEach((category) => {
      categorizedAdapters[category].sort(
        (a, b) => (a.ui?.sortOrder || 999) - (b.ui?.sortOrder || 999)
      );
    });
  }

  return Object.entries(categorizedAdapters).map(([category, adapters]) => ({
    heading: getCategoryDisplayName(category),
    category: category,
    adapters: adapters.map((adapter) => ({
      label: adapter.ui?.displayName || adapter.name,
      icon: adapter.icon,
      type: adapter.type,
      description: adapter.description,
      requiresAuth: adapter.requiresAuth,
      supportsRealtime: adapter.supportsRealtime,
      supportedOperations: adapter.supportedOperations,
      supportedFileTypes: adapter.supportedFileTypes,
      supportedLocations: adapter.supportedLocations,
      route: adapter.ui?.route,
      helpText: adapter.ui?.helpText,
      requirements: adapter.ui?.requirements,
      sortOrder: adapter.ui?.sortOrder,
    })),
  }));
};

const validateDependencies = (type, dependencies) => {
  const adapterInfo = getAdapterInfo(type);
  if (!adapterInfo) {
    throw new Error(`Unsupported adapter type: ${type}`);
  }

  const { authService, apiClient, fileSystem, dbConnection } = dependencies;

  switch (type) {
    case "google-sheets":
      if (!authService) {
        throw new Error("authService is required for Google Sheets adapter");
      }
      if (!apiClient) {
        throw new Error("apiClient is required for Google Sheets adapter");
      }
      break;

    case "microsoft-excel":
      if (!authService) {
        throw new Error("authService is required for Microsoft Excel adapter");
      }
      if (!apiClient) {
        throw new Error("apiClient is required for Microsoft Excel adapter");
      }
      break;

    case "custom-api":
      if (!apiClient) {
        throw new Error("apiClient is required for Custom API adapter");
      }
      break;

    case "custom-ftp":
      if (!apiClient) {
        throw new Error("apiClient is required for Custom FTP adapter");
      }
      break;
    case "mysql":
      if (!apiClient) {
        throw new Error("apiClient is required for MySQL adapter");
      }
      break;

    case "excel":
      if (!authService) {
        throw new Error("authService is required for Excel adapter");
      }
      break;

    default:
      throw new Error(`Validation not implemented for adapter type: ${type}`);
  }
};

const validateOptions = (type, options = {}) => {
  switch (type) {
    case "microsoft-excel":
      if (options.scopes && !Array.isArray(options.scopes)) {
        throw new Error("scopes option must be an array");
      }
      if (options.locations && !Array.isArray(options.locations)) {
        throw new Error("locations option must be an array");
      }
      break;

    case "custom-api":
      if (options.endpoints && typeof options.endpoints !== "object") {
        throw new Error("endpoints option must be an object");
      }
      if (
        options.timeout &&
        (typeof options.timeout !== "number" || options.timeout <= 0)
      ) {
        throw new Error("timeout option must be a positive number");
      }
      if (
        options.retryAttempts &&
        (typeof options.retryAttempts !== "number" || options.retryAttempts < 0)
      ) {
        throw new Error("retryAttempts option must be a non-negative number");
      }
      break;

    case "custom-ftp":
      if (
        options.timeout &&
        (typeof options.timeout !== "number" || options.timeout <= 0)
      ) {
        throw new Error("timeout option must be a positive number");
      }
      if (
        options.maxConnections &&
        (typeof options.maxConnections !== "number" ||
          options.maxConnections <= 0)
      ) {
        throw new Error("maxConnections option must be a positive number");
      }
      break;

    case "google-sheets":
      if (options.scopes && !Array.isArray(options.scopes)) {
        throw new Error("scopes option must be an array");
      }
      break;
    case "mysql":
      if (
        options.poolSize &&
        (typeof options.poolSize !== "number" || options.poolSize <= 0)
      ) {
        throw new Error("poolSize option must be a positive number");
      }
      if (
        options.connectionTimeout &&
        (typeof options.connectionTimeout !== "number" ||
          options.connectionTimeout <= 0)
      ) {
        throw new Error("connectionTimeout option must be a positive number");
      }
      break;

    default:
      break;
  }
};

export const createDataAdapter = (type, dependencies) => {
  try {
    const {
      authService,
      apiClient,
      fileSystem,
      dbConnection,
      endpoints,
      options = {},
    } = dependencies;

    if (!isTypeSupported(type)) {
      throw new Error(
        `Unknown adapter type: ${type}. Supported types: ${getSupportedTypes()
          .map((t) => t.type)
          .join(", ")}`
      );
    }

    validateDependencies(type, dependencies);

    validateOptions(type, options);

    switch (type) {
      case "google-sheets":
        return createGoogleSheetsAdapter(authService, apiClient, {
          ...options,
          endpoints: endpoints?.googleSheets || endpoints,
        });

      case "microsoft-excel":
        return createExcelAdapter(authService, apiClient, {
          ...options,
          endpoints: endpoints?.microsoftExcel || endpoints,
          scopes: options.scopes || [
            "https://graph.microsoft.com/Files.Read",
            "https://graph.microsoft.com/Sites.Read.All",
            "https://graph.microsoft.com/User.Read",
          ],
          locations: options.locations || ["OneDrive", "SharePoint"],
        });

      case "custom-api":
        return createCustomApiAdapter(authService, apiClient, {
          ...options,
          endpoints: endpoints?.customAPI || endpoints,
          timeout: options.timeout || 30000,
          retryAttempts: options.retryAttempts || 3,
          fallbackToDemo: options.fallbackToDemo !== false,
        });

      case "custom-ftp":
        return createCustomFtpAdapter(authService, apiClient, {
          ...options,
          endpoints: endpoints?.customFTP || endpoints,
          timeout: options.timeout || 30000,
          maxConnections: options.maxConnections || 5,
          fallbackToDemo: options.fallbackToDemo !== false,
        });

      case "mysql":
        return createMySqlAdapter(authService, apiClient, {
          ...options,
          endpoints: endpoints?.mysql || endpoints,
          poolSize: options.poolSize || 10,
          connectionTimeout: options.connectionTimeout || 30000,
          fallbackToDemo: options.fallbackToDemo !== false,
        });
      default:
        throw new Error(`Adapter creation not implemented for type: ${type}`);
    }
  } catch (error) {
    console.error(`Failed to create ${type} adapter:`, error);
    throw new Error(`Failed to create ${type} adapter: ${error.message}`);
  }
};

// create multiple adapters based on config
export const createMultipleAdapters = (adapterConfigs) => {
  const adapters = {};
  const errors = {};

  adapterConfigs.forEach(({ type, name, dependencies }) => {
    try {
      adapters[name || type] = createDataAdapter(type, dependencies);
    } catch (error) {
      errors[name || type] = error.message;
    }
  });

  return { adapters, errors };
};

// get capabilities of a specific adapter type
const getAdapterCapabilities = (type) => {
  const adapterInfo = getAdapterInfo(type);
  return adapterInfo
    ? {
        type: adapterInfo.type,
        name: adapterInfo.name,
        requiresAuth: adapterInfo.requiresAuth,
        supportsRealtime: adapterInfo.supportsRealtime,
        supportedOperations: adapterInfo.supportedOperations,
        category: adapterInfo.category,
        supportedFileTypes: adapterInfo.supportedFileTypes,
        supportedLocations: adapterInfo.supportedLocations,
      }
    : null;
};

const adapterSupportsOperation = (type, operation) => {
  const capabilities = getAdapterCapabilities(type);
  return capabilities
    ? capabilities.supportedOperations.includes(operation)
    : false;
};

// get a recommended adapter based on requirements
const getRecommendedAdapter = (requirements = {}) => {
  const {
    requiresAuth,
    supportsRealtime,
    operation,
    category,
    dataSource,
  } = requirements;

  let candidates = getSupportedTypes();

  if (requiresAuth !== undefined) {
    candidates = candidates.filter(
      (adapter) => adapter.requiresAuth === requiresAuth
    );
  }

  if (supportsRealtime !== undefined) {
    candidates = candidates.filter(
      (adapter) => adapter.supportsRealtime === supportsRealtime
    );
  }

  if (operation) {
    candidates = candidates.filter((adapter) =>
      adapter.supportedOperations.includes(operation)
    );
  }

  if (category) {
    candidates = candidates.filter((adapter) => adapter.category === category);
  }

  if (dataSource) {
    if (dataSource.includes("sheets.google.com")) {
      return candidates.find((adapter) => adapter.type === "google-sheets");
    }
    if (
      dataSource.includes("microsoft.com") ||
      dataSource.includes("sharepoint.com") ||
      dataSource.includes("onedrive.com")
    ) {
      return candidates.find((adapter) => adapter.type === "microsoft-excel");
    }
    if (dataSource.startsWith("http") || dataSource.startsWith("https")) {
      return candidates.find((adapter) => adapter.type === "custom-api");
    }
    if (dataSource.startsWith("ftp://") || dataSource.startsWith("sftp://")) {
      return candidates.find((adapter) => adapter.type === "custom-ftp");
    }
    if (dataSource.endsWith(".xlsx") || dataSource.endsWith(".xls")) {
      return candidates.find((adapter) => adapter.type === "microsoft-excel");
    }
  }

  return candidates[0] || null;
};

export {
  getSupportedTypes,
  getAdapterInfo,
  isTypeSupported,
  getAdaptersByCategory,
  getAdaptersWithOperation,
  validateDependencies,
  validateOptions,
  getAdapterCapabilities,
  adapterSupportsOperation,
  getRecommendedAdapter,
  getEnabledAdapters,
  getAdaptersWithRoutes,
  getAdapterRoute,
  getCategoryDisplayName,
  getAdaptersForUI,
};
