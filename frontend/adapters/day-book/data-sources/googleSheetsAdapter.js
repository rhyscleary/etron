import { delay, validateSourceId, formatDate } from "./baseAdapter";

// mock data for demo mode
const createMockData = () => ({
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
  ],
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

export const createGoogleSheetsAdapter = (
  authService,
  apiClient,
  options = {}
) => {
  const isDemoMode =
    options.demoMode || options.fallbackToDemo || typeof __DEV__ !== "undefined"
      ? __DEV__
      : false;
  const mockData = createMockData();

  let connectedAccount = null;
  let accessToken = null;
  let spreadsheets = [];
  let isConnected = false;

  const connectDemo = async () => {
    await delay(1000);
    connectedAccount = mockData.account;
    accessToken = mockData.account.accessToken;
    spreadsheets = [...mockData.spreadsheets];
    isConnected = true;

    return {
      success: true,
      account: connectedAccount,
      isDemoMode: true,
    };
  };

  const connect = async () => {
    if (isDemoMode) {
      return connectDemo();
    }

    try {
      const cognitoUser = await authService.getCurrentUser();
      if (!cognitoUser) {
        throw new Error("User must be authenticated first");
      }

      const session = await authService.fetchAuthSession();
      const tokens = session.tokens;

      // check if user has Google identity
      if (tokens?.idToken?.payload?.identities) {
        const identities = tokens.idToken.payload.identities;
        const googleIdentity = identities.find(
          (identity) => identity.providerName === "Google"
        );

        if (googleIdentity) {
          connectedAccount = {
            email: tokens.idToken.payload.email,
            name: tokens.idToken.payload.name || tokens.idToken.payload.email,
            avatar: tokens.idToken.payload.picture,
            provider: "Google",
          };
        }
      }

      // exchange Cognito token for Google access token
      const cognitoToken = session.tokens?.accessToken?.toString();
      // TODO: Uncomment when backend is ready
      /*
            const response = await apiClient.post('/connections/google/auth', {
                cognitoToken
            });
            const data = await response.json();
            accessToken = data.accessToken;
            */

      isConnected = true;
      return {
        success: true,
        account: connectedAccount,
      };
    } catch (error) {
      console.log("Google Sheets connection failed, falling back to demo mode");
      options.demoMode = true;
      return connectDemo();
    }
  };

  const disconnect = async () => {
    try {
      if (!isDemoMode && authService?.signOut) {
        await authService.signOut();
      }
      connectedAccount = null;
      accessToken = null;
      spreadsheets = [];
      isConnected = false;

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  };

  const getDataSources = async () => {
    if (isDemoMode || options.demoMode) {
      await delay(1500);
      spreadsheets = [...mockData.spreadsheets];
      return spreadsheets;
    }

    if (!isConnected) {
      throw new Error("Not connected to Google Sheets");
    }

    try {
      const session = await authService.fetchAuthSession();
      const cognitoToken = session.tokens?.accessToken?.toString();

      // TODO: Uncomment when backend is ready
      /*
            const response = await apiClient.post('/connections/google/spreadsheets', {
                cognitoToken,
                accessToken
            });
            const data = await response.json();
            spreadsheets = data.spreadsheets.map(sheet => ({
                id: sheet.id,
                name: sheet.name,
                lastModified: sheet.lastModified,
                url: sheet.url,
                type: 'spreadsheet'
            }));
            */

      console.log("Real fetch not implemented, using demo data");
      await delay(1500);
      spreadsheets = [...mockData.spreadsheets];
      return spreadsheets;
    } catch (error) {
      console.log("Real fetch failed, using demo data");
      await delay(1500);
      spreadsheets = [...mockData.spreadsheets];
      return spreadsheets;
    }
  };

  const getData = async (sourceId, options = {}) => {
    validateSourceId(sourceId);

    if (isDemoMode || options.demoMode) {
      await delay(800);
      const mockSheet = mockData.sampleData[sourceId];

      if (!mockSheet) {
        return {
          id: sourceId,
          name: "Demo Spreadsheet",
          data: [
            ["Name", "Value"],
            ["Item 1", "100"],
            ["Item 2", "200"],
          ],
          headers: ["Name", "Value"],
          metadata: { isDemoData: true },
        };
      }

      return {
        id: sourceId,
        name: mockSheet.name,
        data: mockSheet.values,
        headers: mockSheet.headers,
        metadata: {
          range: options.range || "A1:Z1000",
          sheetName: options.sheetName || "Sheet1",
          lastUpdated: new Date().toISOString(),
          isDemoData: true,
        },
      };
    }

    if (!isConnected) {
      throw new Error("Not connected to Google Sheets");
    }

    try {
      const { range = "A1:Z1000", sheetName } = options;
      const session = await authService.fetchAuthSession();
      const cognitoToken = session.tokens?.accessToken?.toString();

      // TODO: Uncomment when backend is ready
      /*
            const response = await apiClient.post('/connections/google/data', {
                cognitoToken,
                accessToken,
                spreadsheetId: sourceId,
                range,
                sheetName
            });
            const data = await response.json();
            
            return {
                id: sourceId,
                name: data.name,
                data: data.values,
                headers: data.headers,
                metadata: {
                    range,
                    sheetName,
                    lastUpdated: new Date().toISOString()
                }
            };
            */

      console.log("Real data fetch not implemented, using demo data");
      return getData(sourceId, { ...options, demoMode: true });
    } catch (error) {
      console.log("Real data fetch failed, falling back to demo data");
      return getData(sourceId, { ...options, demoMode: true });
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    account: connectedAccount,
    provider: "Google Sheets",
    dataSourceCount: spreadsheets.length,
    isDemoMode: isDemoMode || options.demoMode,
  });

  const switchAccount = async () => {
    await disconnect();
    return { requiresReauth: true };
  };

  const filterDataSources = (query, dataSources = spreadsheets) => {
    if (!query) return dataSources;
    return dataSources.filter((sheet) =>
      sheet.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    connect,
    disconnect,
    getDataSources,
    getData,
    isConnected: () => isConnected,
    getConnectionInfo,
    switchAccount,
    filterDataSources,
    formatDate,
  };
};
