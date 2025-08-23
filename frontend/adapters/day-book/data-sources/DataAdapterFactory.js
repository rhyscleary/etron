// Minimal implementation for UI: provide at least one example adapter/category
export function getAdaptersForUI() {
  return [
    {
      heading: "Spreadsheets",
      category: "cloud-storage",
      adapters: [
        {
          label: "Google Sheets",
          icon: "google-spreadsheet",
          type: "google-sheets",
          description: "Connect to Google Sheets via Google Drive API",
          iconColor: "#0F9D58",
          route:
            "/modules/day-book/data-management/data-connection-inputs/google-sheets",
        },
        {
          label: "Microsoft Excel",
          icon: "microsoft-excel",
          type: "microsoft-excel",
          description: "Connect to Excel files via Microsoft Graph API",
          iconColor: "#1D6F42",
          route:
            "/modules/day-book/data-management/data-connection-inputs/excel",
        },
      ],
    },
    {
      heading: "APIs",
      category: "api",
      adapters: [
        {
          label: "Custom API",
          icon: "web",
          type: "api",
          description: "Connect to a custom REST API endpoint",
          route:
            "/modules/day-book/data-management/data-connection-inputs/custom-API",
        },
        {
          label: "Custom FTP",
          icon: "server",
          type: "custom-ftp",
          description: "Connect to FTP/SFTP servers for file access",
          route:
            "/modules/day-book/data-management/data-connection-inputs/custom-FTP",
        },
      ],
    },
    {
      heading: "Databases",
      category: "database",
      adapters: [
        {
          label: "MySQL",
          icon: "database",
          type: "mysql",
          description: "Connect to MySQL databases",
          route:
            "/modules/day-book/data-management/data-connection-inputs/MySQL",
        },
      ],
    },
  ];
}
import { createGoogleSheetsAdapter } from "./googleSheetsAdapter";
import { createExcelAdapter } from "./excelAdapter";
import { createCustomApiAdapter } from "./apiAdapter";
import { createCustomFtpAdapter } from "./ftpAdapter";
import { createMySqlAdapter } from "./mySqlAdapter";

const adapterMap = {
  "google-sheets": createGoogleSheetsAdapter,
  "microsoft-excel": createExcelAdapter,
  // Support backend 'api' type by mapping to the custom API adapter
  api: createCustomApiAdapter,
  "custom-api": createCustomApiAdapter,
  "custom-ftp": createCustomFtpAdapter,
  mysql: createMySqlAdapter,
};

export function createDataAdapter(type, dependencies) {
  const factory = adapterMap[type];
  if (!factory) throw new Error(`No adapter for type: ${type}`);
  return factory(
    dependencies.authService,
    dependencies.apiClient,
    dependencies.options || {}
  );
}

export function getSupportedTypes() {
  return Object.keys(adapterMap);
}

const typeToCategory = {
  // Spreadsheets / cloud storage
  "google-sheets": "cloud-storage",
  "microsoft-excel": "cloud-storage",
  // APIs
  api: "api",
  "custom-api": "api",
  // File transfer
  "custom-ftp": "file-transfer",
  // Databases
  mysql: "database",
};

export function getCategoryDisplayName(category) {
  switch (category) {
    case "cloud-storage":
      return "Spreadsheets";
    case "api":
      return "APIs";
    case "database":
      return "Databases";
    case "file-transfer":
      return "File Transfer";
    default:
      return "Other";
  }
}

export function getAdapterInfo(type) {
  const category = typeToCategory[type] || "other";
  return {
    type,
    category,
    categoryDisplayName: getCategoryDisplayName(category),
  };
}
