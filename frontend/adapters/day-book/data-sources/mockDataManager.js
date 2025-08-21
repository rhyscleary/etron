import { demoConfigManager } from "../../../config/demoConfig";

// utility functions for generating mock data with configurable behavior
const getRandomResponseTime = (demoConfig) => {
  if (!demoConfig.data.simulateNetworkDelay) return "1ms";
  return `${Math.floor(Math.random() * 500 + 50)}ms`;
};

const getCurrentTimestamp = (demoConfig) => {
  return demoConfig.data.useRealTimestamps
    ? new Date()
    : new Date("2024-01-15T10:30:00Z");
};

const getBaseId = (demoConfig) => {
  return demoConfig.data.generateRandomIds ? Date.now() : 1642105600000;
};

// creates mock data for API connections with sample endpoints and responses
const createApiMockData = (demoConfig = demoConfigManager.getConfig()) => {
  const currentTime = getCurrentTimestamp(demoConfig);
  const baseId = getBaseId(demoConfig);

  const connections = [
    {
      id: `api_${baseId}`,
      name: "JSONPlaceholder API",
      url: "https://jsonplaceholder.typicode.com",
      status:
        demoConfig.data.includeErrorStates && Math.random() < 0.1
          ? "error"
          : "active",
      createdAt: new Date(
        currentTime.getTime() - Math.random() * 2592000000
      ).toISOString(),
      lastTested: new Date(
        currentTime.getTime() - Math.random() * 86400000
      ).toISOString(),
      headers: '{"Content-Type": "application/json"}',
      authentication: "",
      testResult: {
        status: "connected",
        responseTime: getRandomResponseTime(demoConfig),
        statusCode: 200,
        contentType: "application/json",
      },
    },
    {
      id: `api_${baseId + 3600000}`,
      name: "Weather API",
      url: "https://api.openweathermap.org/data/2.5",
      status:
        demoConfig.data.includeErrorStates && Math.random() < 0.15
          ? "error"
          : "active",
      createdAt: new Date(
        currentTime.getTime() - Math.random() * 2592000000
      ).toISOString(),
      lastTested: new Date(
        currentTime.getTime() - Math.random() * 86400000
      ).toISOString(),
      headers: '{"Accept": "application/json"}',
      authentication: '{"type": "query", "key": "appid", "value": "demo_key"}',
      testResult: {
        status: "connected",
        responseTime: getRandomResponseTime(demoConfig),
        statusCode: 200,
        contentType: "application/json",
      },
    },
    {
      id: `api_${baseId + 7200000}`,
      name: "E-commerce API",
      url: "https://api.store.com/v1",
      status: "active",
      createdAt: new Date(
        currentTime.getTime() - Math.random() * 2592000000
      ).toISOString(),
      lastTested: new Date(
        currentTime.getTime() - Math.random() * 86400000
      ).toISOString(),
      headers: '{"Authorization": "Bearer demo_token"}',
      authentication: '{"type": "bearer", "token": "demo_token"}',
      testResult: {
        status: "connected",
        responseTime: getRandomResponseTime(demoConfig),
        statusCode: 200,
        contentType: "application/json",
      },
    },
  ];

  const limitedConnections = connections.slice(
    0,
    Math.min(demoConfig.data.sourceCount || 3, connections.length)
  );

  const sampleData = {};
  limitedConnections.forEach((conn) => {
    sampleData[conn.id] = generateApiSampleData(conn, demoConfig);
  });

  return { connections: limitedConnections, sampleData };
};

const generateApiSampleData = (connection, demoConfig) => {
  if (connection.name.includes("JSONPlaceholder")) {
    return {
      name: "JSONPlaceholder API",
      endpoints: [
        { path: "/posts", method: "GET", data: generatePostsData(demoConfig) },
        { path: "/users", method: "GET", data: generateUsersData(demoConfig) },
        {
          path: "/comments",
          method: "GET",
          data: generateCommentsData(demoConfig),
        },
      ],
    };
  } else if (connection.name.includes("Weather")) {
    return {
      name: "Weather API",
      endpoints: [
        {
          path: "/weather",
          method: "GET",
          data: generateWeatherData(demoConfig),
        },
        {
          path: "/forecast",
          method: "GET",
          data: generateForecastData(demoConfig),
        },
      ],
    };
  } else if (connection.name.includes("E-commerce")) {
    return {
      name: "E-commerce API",
      endpoints: [
        {
          path: "/products",
          method: "GET",
          data: generateProductsData(demoConfig),
        },
        {
          path: "/orders",
          method: "GET",
          data: generateOrdersData(demoConfig),
        },
      ],
    };
  }

  return {
    name: connection.name,
    endpoints: [
      { path: "/data", method: "GET", data: generateGenericData(demoConfig) },
    ],
  };
};

// generates mock Microsoft Excel spreadsheet data with sample worksheets
const createExcelMockData = (demoConfig = demoConfigManager.getConfig()) => ({
  account: {
    email: "demo@outlook.com",
    name: "Demo Microsoft User",
    avatar: null,
    accessToken: "DEMO_MICROSOFT_ACCESS_TOKEN",
    provider: "Microsoft Excel",
  },
  spreadsheets: [
    {
      id: "01ABCDEF123456789",
      name: "Financial Report 2024.xlsx",
      lastModified: "2024-01-20T15:45:00Z",
      url: "https://graph.microsoft.com/v1.0/me/drive/items/01ABCDEF123456789",
      size: "2.5 MB",
      location: "OneDrive",
      type: "excel",
    },
    {
      id: "01BCDEFG234567890",
      name: "Inventory Tracking.xlsx",
      lastModified: "2024-01-18T11:30:00Z",
      url: "https://graph.microsoft.com/v1.0/me/drive/items/01BCDEFG234567890",
      size: "1.8 MB",
      location: "OneDrive",
      type: "excel",
    },
    {
      id: "01CDEFGH345678901",
      name: "Sales Dashboard Q1.xlsx",
      lastModified: "2024-01-16T09:22:00Z",
      url: "https://graph.microsoft.com/v1.0/me/drive/items/01CDEFGH345678901",
      size: "3.2 MB",
      location: "SharePoint",
      type: "excel",
    },
  ].slice(0, demoConfig.data.sourceCount || 3),
  sampleData: {
    "01ABCDEF123456789": {
      name: "Financial Report 2024.xlsx",
      worksheets: ["Summary", "Q1", "Q2", "Q3", "Q4"],
      headers: ["Month", "Revenue", "Expenses", "Profit", "Growth %"],
      values: [
        ["January", "120000", "85000", "35000", "15.2"],
        ["February", "135000", "92000", "43000", "22.9"],
        ["March", "148000", "98000", "50000", "16.3"],
        ["April", "162000", "105000", "57000", "14.0"],
      ],
    },
    "01BCDEFG234567890": {
      name: "Inventory Tracking.xlsx",
      worksheets: ["Current Stock", "Orders", "Suppliers"],
      headers: [
        "Product ID",
        "Product Name",
        "Quantity",
        "Unit Price",
        "Total Value",
      ],
      values: [
        ["P001", "Laptop", "25", "1200", "30000"],
        ["P002", "Mouse", "150", "25", "3750"],
        ["P003", "Keyboard", "80", "75", "6000"],
        ["P004", "Monitor", "45", "300", "13500"],
      ],
    },
    "01CDEFGH345678901": {
      name: "Sales Dashboard Q1.xlsx",
      worksheets: ["Dashboard", "Raw Data", "Charts"],
      headers: ["Sales Rep", "Region", "Q1 Sales", "Target", "Achievement %"],
      values: [
        ["John Smith", "North", "250000", "200000", "125"],
        ["Sarah Jones", "South", "180000", "150000", "120"],
        ["Mike Wilson", "East", "320000", "300000", "107"],
        ["Lisa Brown", "West", "190000", "175000", "109"],
      ],
    },
  },
});

// creates mock Google Sheets data with sample spreadsheets and content
const createGoogleSheetsMockData = (
  demoConfig = demoConfigManager.getConfig()
) => ({
  account: {
    email: "demo@gmail.com",
    name: "Demo User",
    avatar: null,
    accessToken: "DEMO_ACCESS_TOKEN",
    provider: "Google Sheets",
  },
  spreadsheets: [
    {
      id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      name: "Budget 2024",
      lastModified: "2024-01-15T10:30:00Z",
      url:
        "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      type: "spreadsheet",
    },
    {
      id: "2CyjOWt1YSB6oGNeL",
      name: "Sales Data Q1",
      lastModified: "2024-01-10T14:22:00Z",
      url: "https://docs.google.com/spreadsheets/d/2CyjOWt1YSB6oGNeL",
      type: "spreadsheet",
    },
    {
      id: "3DzkPXu2ZTC7pHOfM",
      name: "Employee Database",
      lastModified: "2024-01-20T09:15:00Z",
      url: "https://docs.google.com/spreadsheets/d/3DzkPXu2ZTC7pHOfM",
      type: "spreadsheet",
    },
  ].slice(0, demoConfig.data.sourceCount || 3),
  sampleData: {
    "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms": {
      name: "Budget 2024",
      headers: ["Category", "Planned", "Actual", "Variance"],
      values: [
        ["Housing", "2000", "1950", "-50"],
        ["Food", "800", "750", "-50"],
        ["Transportation", "500", "550", "50"],
        ["Entertainment", "300", "280", "-20"],
      ],
    },
    "2CyjOWt1YSB6oGNeL": {
      name: "Sales Data Q1",
      headers: ["Month", "Revenue", "Units Sold", "Avg Price"],
      values: [
        ["January", "50000", "100", "500"],
        ["February", "60000", "120", "500"],
        ["March", "75000", "150", "500"],
      ],
    },
    "3DzkPXu2ZTC7pHOfM": {
      name: "Employee Database",
      headers: ["Name", "Department", "Salary", "Start Date"],
      values: [
        ["John Doe", "Engineering", "75000", "2023-01-15"],
        ["Jane Smith", "Marketing", "65000", "2023-03-01"],
        ["Bob Johnson", "Sales", "60000", "2023-02-10"],
      ],
    },
  },
});

// generates mock FTP server connections and file listings
const createFtpMockData = (demoConfig = demoConfigManager.getConfig()) => ({
  connections: [
    {
      id: "ftp_1642105600000",
      name: "Demo FTP Server",
      hostname: "ftp.demo.com",
      port: "21",
      username: "demo_user",
      directory: "/data",
      status: "connected",
      createdAt: "2024-01-15T10:30:00Z",
      lastConnected: "2024-01-15T10:30:00Z",
      testResult: {
        status: "success",
        responseTime: getRandomResponseTime(demoConfig),
        features: ["read", "write", "list"],
        serverType: "Demo FTP Server",
      },
    },
    {
      id: "ftp_1642109200000",
      name: "Production FTP",
      hostname: "ftp.production.com",
      port: "22",
      username: "prod_user",
      directory: "/uploads",
      status: "connected",
      createdAt: "2024-01-16T11:30:00Z",
      lastConnected: "2024-01-16T11:30:00Z",
      testResult: {
        status: "success",
        responseTime: getRandomResponseTime(demoConfig),
        features: ["read", "write", "list", "sftp"],
        serverType: "SFTP Server",
      },
    },
  ].slice(0, demoConfig.data.sourceCount || 2),
  files: [
    {
      name: "sales_data.csv",
      path: "/data/sales_data.csv",
      size: 1024,
      modified: "2024-01-15T10:30:00Z",
      type: "file",
    },
    {
      name: "inventory.json",
      path: "/data/inventory.json",
      size: 2048,
      modified: "2024-01-14T15:20:00Z",
      type: "file",
    },
    {
      name: "customer_data.xlsx",
      path: "/data/customer_data.xlsx",
      size: 4096,
      modified: "2024-01-13T14:10:00Z",
      type: "file",
    },
  ],
  sampleData: {
    ftp_1642105600000: {
      name: "Demo FTP Server",
      files: [
        {
          path: "/data/sales_data.csv",
          name: "Sales Data",
          data: [
            {
              date: "2024-01-01",
              product: "Widget A",
              quantity: 10,
              revenue: 1000,
            },
            {
              date: "2024-01-02",
              product: "Widget B",
              quantity: 15,
              revenue: 1500,
            },
            {
              date: "2024-01-03",
              product: "Widget A",
              quantity: 8,
              revenue: 800,
            },
          ],
        },
        {
          path: "/data/inventory.json",
          name: "Inventory Data",
          data: [
            { id: 1, item: "Widget A", stock: 100, location: "Warehouse A" },
            { id: 2, item: "Widget B", stock: 75, location: "Warehouse B" },
            { id: 3, item: "Widget C", stock: 50, location: "Warehouse A" },
          ],
        },
      ],
    },
    ftp_1642109200000: {
      name: "Production FTP",
      files: [
        {
          path: "/uploads/customer_data.xlsx",
          name: "Customer Data",
          data: [
            {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              city: "New York",
            },
            {
              id: 2,
              name: "Jane Smith",
              email: "jane@example.com",
              city: "Los Angeles",
            },
            {
              id: 3,
              name: "Bob Johnson",
              email: "bob@example.com",
              city: "Chicago",
            },
          ],
        },
      ],
    },
  },
});

// creates mock MySQL database connections with sample tables and data
const createMySqlMockData = (demoConfig = demoConfigManager.getConfig()) => ({
  connections: [
    {
      id: "mysql_1642105600000",
      name: "Local MySQL",
      host: "localhost",
      port: 3306,
      username: "root",
      database: "demo_db",
      status: "active",
      createdAt: "2024-01-15T10:30:00Z",
      lastTested: "2024-01-15T10:30:00Z",
      password: "",
      testResult: {
        status: "success",
        responseTime: getRandomResponseTime(demoConfig),
        statusCode: 200,
        contentType: "mysql",
      },
    },
    {
      id: "mysql_1642109200000",
      name: "Remote MySQL",
      host: "remote.example.com",
      port: 3306,
      username: "admin",
      database: "weather_db",
      status: "active",
      createdAt: "2024-01-16T11:30:00Z",
      lastTested: "2024-01-16T11:30:00Z",
      password: "",
      testResult: {
        status: "success",
        responseTime: getRandomResponseTime(demoConfig),
        statusCode: 200,
        contentType: "mysql",
      },
    },
  ].slice(0, demoConfig.data.sourceCount || 2),
  sampleData: {
    mysql_1642105600000: {
      name: "Local MySQL",
      tables: [
        {
          name: "posts",
          columns: ["id", "title", "body", "userId"],
          rows: [
            {
              id: 1,
              title: "Sample Post 1",
              body: "Sample content 1",
              userId: 1,
            },
            {
              id: 2,
              title: "Sample Post 2",
              body: "Sample content 2",
              userId: 1,
            },
            {
              id: 3,
              title: "Sample Post 3",
              body: "Sample content 3",
              userId: 2,
            },
          ],
        },
        {
          name: "users",
          columns: ["id", "name", "email", "username"],
          rows: [
            {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              username: "johndoe",
            },
            {
              id: 2,
              name: "Jane Smith",
              email: "jane@example.com",
              username: "janesmith",
            },
          ],
        },
      ],
    },
    mysql_1642109200000: {
      name: "Remote MySQL",
      tables: [
        {
          name: "weather",
          columns: ["city", "temperature", "humidity", "description"],
          rows: [
            {
              city: "London",
              temperature: 15,
              humidity: 65,
              description: "Cloudy",
            },
            {
              city: "New York",
              temperature: 22,
              humidity: 45,
              description: "Sunny",
            },
            {
              city: "Tokyo",
              temperature: 18,
              humidity: 70,
              description: "Rainy",
            },
          ],
        },
      ],
    },
  },
});

// reusable data generators for common content types across adapters
const generatePostsData = (demoConfig) => [
  {
    id: 1,
    title: "Introduction to APIs",
    body: "Understanding REST APIs and their importance...",
    userId: 1,
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: 2,
    title: "Data Integration Best Practices",
    body: "How to effectively integrate multiple data sources...",
    userId: 2,
    createdAt: "2024-01-12T14:30:00Z",
  },
  {
    id: 3,
    title: "Real-time Analytics",
    body: "Building dashboards with live data updates...",
    userId: 1,
    createdAt: "2024-01-15T10:15:00Z",
  },
];

const generateUsersData = (demoConfig) => [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@example.com",
    username: "alexj",
    role: "admin",
  },
  {
    id: 2,
    name: "Sarah Chen",
    email: "sarah@example.com",
    username: "sarach",
    role: "user",
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike@example.com",
    username: "mikew",
    role: "user",
  },
];

const generateCommentsData = (demoConfig) => [
  {
    id: 1,
    postId: 1,
    name: "Great article!",
    email: "reader@example.com",
    body: "Very informative content.",
  },
  {
    id: 2,
    postId: 1,
    name: "Thanks!",
    email: "user2@example.com",
    body: "This helped me understand APIs better.",
  },
  {
    id: 3,
    postId: 2,
    name: "Useful tips",
    email: "dev@example.com",
    body: "I'll implement these in my next project.",
  },
];

const generateWeatherData = (demoConfig) => [
  {
    city: "London",
    temperature: 15,
    humidity: 65,
    description: "Cloudy",
    windSpeed: 12,
  },
  {
    city: "New York",
    temperature: 22,
    humidity: 45,
    description: "Sunny",
    windSpeed: 8,
  },
  {
    city: "Tokyo",
    temperature: 18,
    humidity: 70,
    description: "Rainy",
    windSpeed: 15,
  },
  {
    city: "Sydney",
    temperature: 25,
    humidity: 55,
    description: "Partly Cloudy",
    windSpeed: 10,
  },
];

const generateForecastData = (demoConfig) => {
  const days = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5"];
  return days.map((day, index) => ({
    day,
    high: 20 + Math.floor(Math.random() * 15),
    low: 10 + Math.floor(Math.random() * 10),
    description: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"][
      Math.floor(Math.random() * 4)
    ],
  }));
};

const generateProductsData = (demoConfig) => [
  {
    id: 1,
    name: "Laptop Pro",
    price: 1299.99,
    category: "Electronics",
    stock: 45,
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: 199.99,
    category: "Electronics",
    stock: 120,
  },
  {
    id: 3,
    name: "Office Chair",
    price: 299.99,
    category: "Furniture",
    stock: 25,
  },
  {
    id: 4,
    name: "Coffee Maker",
    price: 89.99,
    category: "Appliances",
    stock: 67,
  },
];

const generateOrdersData = (demoConfig) => [
  {
    id: 1001,
    customerId: 501,
    total: 1499.98,
    status: "delivered",
    date: "2024-01-10T09:30:00Z",
  },
  {
    id: 1002,
    customerId: 502,
    total: 199.99,
    status: "shipped",
    date: "2024-01-12T15:45:00Z",
  },
  {
    id: 1003,
    customerId: 503,
    total: 389.98,
    status: "processing",
    date: "2024-01-15T11:20:00Z",
  },
];

const generateGenericData = (demoConfig) => [
  { id: 1, name: "Item 1", value: 100, timestamp: new Date().toISOString() },
  { id: 2, name: "Item 2", value: 200, timestamp: new Date().toISOString() },
  { id: 3, name: "Item 3", value: 300, timestamp: new Date().toISOString() },
];

// main class that manages mock data creation and caching for all adapter types
class MockDataManager {
  constructor() {
    this.cache = new Map();
    this.setupConfigListener();
  }

  setupConfigListener() {
    if (demoConfigManager) {
      this.configUnsubscribe = demoConfigManager.addListener((newConfig) => {
        // Clear cache when demo config changes
        this.cache.clear();
      });
    }
  }

  getMockData(adapterType, forceRefresh = false) {
    const cacheKey = `${adapterType}_${JSON.stringify(
      demoConfigManager.getConfig()
    )}`;

    if (!forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const demoConfig = demoConfigManager.getConfig();
    let mockData;

    switch (adapterType) {
      case "custom-api":
        mockData = createApiMockData(demoConfig);
        break;
      case "microsoft-excel":
        mockData = createExcelMockData(demoConfig);
        break;
      case "google-sheets":
        mockData = createGoogleSheetsMockData(demoConfig);
        break;
      case "custom-ftp":
        mockData = createFtpMockData(demoConfig);
        break;
      case "mysql":
        mockData = createMySqlMockData(demoConfig);
        break;
      default:
        mockData = { connections: [], sampleData: {} };
    }

    this.cache.set(cacheKey, mockData);
    return mockData;
  }

  clearCache() {
    this.cache.clear();
  }

  destroy() {
    if (this.configUnsubscribe) {
      this.configUnsubscribe();
    }
    this.cache.clear();
  }
}

// single shared instance for use across the application
export const mockDataManager = new MockDataManager();

// individual functions exported for direct use when needed
export {
  createApiMockData,
  createExcelMockData,
  createGoogleSheetsMockData,
  createFtpMockData,
  createMySqlMockData,
  generatePostsData,
  generateUsersData,
  generateCommentsData,
  generateWeatherData,
  generateForecastData,
  generateProductsData,
  generateOrdersData,
  generateGenericData,
  getRandomResponseTime,
  getCurrentTimestamp,
  getBaseId,
};
