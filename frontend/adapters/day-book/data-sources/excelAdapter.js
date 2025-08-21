import { delay, validateSourceId, formatDate } from "./baseAdapter";
import { mockDataManager } from "./mockDataManager";


export const createExcelAdapter = (authService, apiClient, options = {}) => {
  const isDemoMode =
    options.demoMode || options.fallbackToDemo || typeof __DEV__ !== "undefined"
      ? __DEV__
      : false;
  const mockData = mockDataManager.getMockData("microsoft-excel");

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

      // check if the user has a microsoft identity linked to their account
      if (tokens?.idToken?.payload?.identities) {
        const identities = tokens.idToken.payload.identities;
        const microsoftIdentity = identities.find(
          (identity) =>
            identity.providerName === "LoginWithAmazon" ||
            identity.providerName === "Microsoft"
        );

        if (microsoftIdentity) {
          connectedAccount = {
            email: tokens.idToken.payload.email,
            name: tokens.idToken.payload.name || tokens.idToken.payload.email,
            avatar: tokens.idToken.payload.picture,
            provider: "Microsoft",
          };
        }
      }

      // exchange Cognito token for Microsoft Graph access token
      const cognitoToken = session.tokens?.accessToken?.toString();
      // TODO: Uncomment when backend is ready
      /*
      const response = await apiClient.post('/connections/microsoft/auth', {
        cognitoToken,
        scopes: [
          'https://graph.microsoft.com/Files.Read',
          'https://graph.microsoft.com/Sites.Read.All',
          'https://graph.microsoft.com/User.Read'
        ]
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
      console.log(
        "Microsoft Excel connection failed, falling back to demo mode"
      );

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
      throw new Error("Not connected to Microsoft Excel");
    }

    try {
      const session = await authService.fetchAuthSession();
      const cognitoToken = session.tokens?.accessToken?.toString();

      // TODO: Uncomment when backend is ready
      /*
      const response = await apiClient.post('/connections/microsoft/spreadsheets', {
        cognitoToken,
        accessToken
      });
      const data = await response.json();
      spreadsheets = data.spreadsheets.map(sheet => ({
        id: sheet.id,
        name: sheet.name,
        lastModified: sheet.lastModified,
        url: sheet.url,
        size: sheet.size,
        location: sheet.location,
        type: 'excel'
      }));
      */

      console.log("Real Excel fetch not implemented, using demo data");
      await delay(1500);
      spreadsheets = [...mockData.spreadsheets];
      return spreadsheets;
    } catch (error) {
      console.log("Real Excel fetch failed, using demo data");
      await delay(1500);
      spreadsheets = [...mockData.spreadsheets];
      return spreadsheets;
    }
  };

  const getData = async (sourceId, options = {}) => {
    validateSourceId(sourceId);

    if (isDemoMode || options.demoMode) {
      await delay(800);
      const mockExcel = mockData.sampleData[sourceId];

      if (!mockExcel) {
        return {
          id: sourceId,
          name: "Demo Excel File.xlsx",
          data: [
            ["Name", "Value"],
            ["Item 1", "100"],
            ["Item 2", "200"],
          ],
          headers: ["Name", "Value"],
          worksheets: ["Sheet1"],
          metadata: {
            isDemoData: true,
            location: "OneDrive",
            size: "1.2 MB",
          },
        };
      }

      return {
        id: sourceId,
        name: mockExcel.name,
        data: mockExcel.values,
        headers: mockExcel.headers,
        worksheets: mockExcel.worksheets,
        metadata: {
          worksheet: options.worksheet || mockExcel.worksheets[0],
          range: options.range || "A1:Z1000",
          lastUpdated: new Date().toISOString(),
          isDemoData: true,
          location:
            spreadsheets.find((s) => s.id === sourceId)?.location || "OneDrive",
          size: spreadsheets.find((s) => s.id === sourceId)?.size || "Unknown",
        },
      };
    }

    if (!isConnected) {
      throw new Error("Not connected to Microsoft Excel");
    }

    try {
      const { range = "A1:Z1000", worksheet } = options;
      const session = await authService.fetchAuthSession();
      const cognitoToken = session.tokens?.accessToken?.toString();

      // TODO: Uncomment when backend is ready
      /*
      const response = await apiClient.post('/connections/microsoft/data', {
        cognitoToken,
        accessToken,
        fileId: sourceId,
        range,
        worksheet
      });
      const data = await response.json();
      
      return {
        id: sourceId,
        name: data.name,
        data: data.values,
        headers: data.headers,
        worksheets: data.worksheets,
        metadata: {
          worksheet: data.worksheet,
          range,
          lastUpdated: new Date().toISOString(),
          location: data.location,
          size: data.size
        }
      };
      */

      console.log("Real Excel data fetch not implemented, using demo data");
      return getData(sourceId, { ...options, demoMode: true });
    } catch (error) {
      console.log("Real Excel data fetch failed, falling back to demo data");
      return getData(sourceId, { ...options, demoMode: true });
    }
  };

  const getWorksheets = async (sourceId) => {
    validateSourceId(sourceId);

    if (isDemoMode || options.demoMode) {
      await delay(500);
      const mockExcel = mockData.sampleData[sourceId];
      return mockExcel ? mockExcel.worksheets : ["Sheet1"];
    }

    if (!isConnected) {
      throw new Error("Not connected to Microsoft Excel");
    }

    try {
      const session = await authService.fetchAuthSession();
      const cognitoToken = session.tokens?.accessToken?.toString();

      // TODO: Uncomment when backend is ready
      /*
      const response = await apiClient.post('/connections/microsoft/worksheets', {
        cognitoToken,
        accessToken,
        fileId: sourceId
      });
      const data = await response.json();
      return data.worksheets;
      */

      // temporary fallback to demo data until backend is implemented
      const mockExcel = mockData.sampleData[sourceId];
      return mockExcel ? mockExcel.worksheets : ["Sheet1"];
    } catch (error) {
      console.log("Real worksheet fetch failed, falling back to demo data");
      const mockExcel = mockData.sampleData[sourceId];
      return mockExcel ? mockExcel.worksheets : ["Sheet1"];
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    account: connectedAccount,
    provider: "Microsoft Excel",
    dataSourceCount: spreadsheets.length,
    isDemoMode: isDemoMode || options.demoMode,
    supportedFileTypes: [".xlsx", ".xls"],
    supportedLocations: ["OneDrive", "SharePoint"],
  });

  const switchAccount = async () => {
    await disconnect();
    return { requiresReauth: true };
  };

  const filterDataSources = (
    query,
    dataSources = spreadsheets,
    locationFilter = "All"
  ) => {
    let filtered = dataSources;

    if (query) {
      filtered = filtered.filter((sheet) =>
        sheet.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (locationFilter && locationFilter !== "All") {
      filtered = filtered.filter((sheet) => sheet.location === locationFilter);
    }

    return filtered;
  };

  const getFilterOptions = () => {
    const oneDriveCount = spreadsheets.filter(
      (sheet) => sheet.location === "OneDrive"
    ).length;
    const sharePointCount = spreadsheets.filter(
      (sheet) => sheet.location === "SharePoint"
    ).length;

    return [
      { label: "All", count: spreadsheets.length, value: "All" },
      { label: "OneDrive", count: oneDriveCount, value: "OneDrive" },
      { label: "SharePoint", count: sharePointCount, value: "SharePoint" },
    ];
  };

  return {
    connect,
    disconnect,
    getDataSources,
    getData,
    getWorksheets,
    isConnected: () => isConnected,
    getConnectionInfo,
    switchAccount,
    filterDataSources,
    getFilterOptions,
    formatDate,
  };
};
