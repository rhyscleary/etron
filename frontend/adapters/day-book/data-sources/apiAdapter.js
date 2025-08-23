import { delay, validateSourceId, formatDate } from "./baseAdapter";

// utility functions for parsing and handling API connection data
const parseHeaders = (headersString) => {
  if (!headersString?.trim()) return {};
  try {
    return JSON.parse(headersString);
  } catch (error) {
    console.warn("Failed to parse headers:", error);
    return {};
  }
};

const parseAuthentication = (authString) => {
  if (!authString?.trim()) return null;
  try {
    return JSON.parse(authString);
  } catch (error) {
    console.warn("Failed to parse authentication:", error);
    return null;
  }
};

// Encode basic auth credentials safely across environments (web/RN/node)
const encodeBase64 = (str) => {
  try {
    if (typeof btoa === "function") return btoa(str);
  } catch {}
  try {
    // Buffer is available in many RN/node setups
    // eslint-disable-next-line no-undef
    if (typeof Buffer !== "undefined")
      return Buffer.from(str, "utf-8").toString("base64");
  } catch {}
  console.warn(
    "Base64 encoding fallback in use; credentials may not be encoded correctly."
  );
  return str;
};

const applyAuthentication = (config, auth) => {
  if (!auth) return config;

  switch (auth.type) {
    case "bearer":
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${auth.token}`,
      };
      break;
    case "basic":
      // CHANGED: avoid raw btoa; use robust encoder
      const credentials = encodeBase64(`${auth.username}:${auth.password}`);
      config.headers = {
        ...config.headers,
        Authorization: `Basic ${credentials}`,
      };
      break;
    case "apikey":
      config.headers = {
        ...config.headers,
        [auth.key]: auth.value,
      };
      break;
    case "query":
      if (!config.params) config.params = {};
      config.params[auth.key] = auth.value;
      break;
    default:
      console.warn("Unknown authentication type:", auth.type);
  }

  return config;
};

// Fix URL building so base paths are preserved and query params are merged correctly.
const buildApiUrl = (baseUrl, endpoint, params = {}) => {
  // CHANGED: do not use new URL with a leading slash which resets the path.
  const [basePath, baseQuery] = String(baseUrl).split("?");
  const trimmedBase = basePath.replace(/\/+$/, ""); // remove trailing slashes
  const ep =
    endpoint && endpoint !== "/" ? String(endpoint).replace(/^\/+/, "") : "";
  const urlWithoutQuery = ep ? `${trimmedBase}/${ep}` : trimmedBase;

  const search = new URLSearchParams(baseQuery || "");
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.append(key, value);
  });
  const qs = search.toString();
  return qs ? `${urlWithoutQuery}?${qs}` : urlWithoutQuery;
};

// Produce a concise, actionable error message for failed HTTP calls
const summarizeRequestError = (error, reqUrl) => {
  const status =
    error?.response?.status ?? error?.statusCode ?? error?.status ?? null;
  const headers = error?.response?.headers || {};
  const contentType = headers["content-type"] || headers["Content-Type"] || "";
  const data = error?.response?.data;
  const body =
    typeof data === "string"
      ? data
      : data
      ? (() => {
          try {
            return JSON.stringify(data);
          } catch {
            return String(data);
          }
        })()
      : "";
  const isHtml =
    /text\/html/i.test(contentType) || /<!DOCTYPE html>/i.test(body || "");
  const ngrokOffline = /ERR_NGROK_3200|endpoint .* is offline/i.test(
    body || ""
  );
  let hint = "";
  if (isHtml && ngrokOffline) hint = "ngrok endpoint appears offline";
  else if (isHtml) hint = "server returned an HTML error page";

  const preview = isHtml
    ? hint
    : (body || "")
        .replace(/\s+/g, " ")
        .slice(0, 200)
        .trim();

  const statusPart = status ? `Server error ${status}` : "Request failed";
  const urlPart = reqUrl ? ` (${reqUrl})` : "";
  return [statusPart, preview ? `- ${preview}` : "", urlPart].join(" ").trim();
};

export const createCustomApiAdapter = (
  authService,
  apiClient,
  options = {}
) => {
  // Production-only mode
  const isDemoMode = false;
  console.log("[CustomApiAdapter] initialized in production mode");

  // initialize state
  let connections = [];
  let currentConnection = null;
  let isConnected = false;

  // listen for demo configuration changes
  let configUnsubscribe = null;

  // simulate network delays based on config
  const simulateDelay = async () => {};

  // simulate errors based on config
  const maybeSimulateError = () => {};

  // Demo connect removed

  const connect = async (connectionData) => {
    console.log("[CustomApiAdapter] connect called");
    try {
      if (!connectionData || !connectionData.url || !connectionData.name) {
        throw new Error("Connection data with URL and name is required");
      }

      const testResult = await testConnection(
        connectionData.url,
        connectionData.headers,
        connectionData.authentication
      );

      // CHANGED: accept both success and connected
      if (!["success", "connected"].includes(testResult.status)) {
        throw new Error("Connection test failed");
      }

      // In real implementation, this would call the actual API
      const newConnection = {
        id: `api_${Date.now()}`,
        name: connectionData.name,
        url: connectionData.url,
        status: "active",
        createdAt: new Date().toISOString(),
        lastTested: new Date().toISOString(),
        headers: connectionData.headers || "{}",
        authentication: connectionData.authentication || "",
        testResult,
      };

      currentConnection = newConnection;
      connections = [newConnection, ...connections];
      isConnected = true;

      console.log(`Real API connection established: ${newConnection.name}`);

      return {
        connected: true,
        connection: currentConnection,
      };
    } catch (error) {
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await simulateDelay("disconnect");

      const wasConnected = isConnected;
      const connectionName = currentConnection?.name;

      currentConnection = null;
      connections = [];
      isConnected = false;

      if (wasConnected) {
        console.log(`Disconnected from API: ${connectionName}`);
      }

      return { connected: true };
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  };

  // tests API connections with a real HTTP request
  const testConnection = async (url, headers = "", authentication = "") => {
    console.log("[CustomApiAdapter] testConnection called", { url });
    try {
      const parsedHeaders = parseHeaders(headers);
      const auth = parseAuthentication(authentication);

      const requestHeaders = {
        Accept: "application/json",
        ...parsedHeaders,
      };

      // apply auth to headers-only config
      const hdrConfig = applyAuthentication({ headers: requestHeaders }, auth);
      const finalHeaders = hdrConfig.headers || requestHeaders;

      const requestUrl = buildApiUrl(url, "", {});
      const start = Date.now();
      const response = await apiClient.get(requestUrl, {
        headers: finalHeaders,
        timeout: 10000,
        params: {},
      });
      const durationMs = Date.now() - start;

      const statusCode = response?.status ?? response?.statusCode ?? 200;
      const contentType =
        response?.headers?.["content-type"] ||
        response?.headers?.["Content-Type"] ||
        "";
      const sampleData = response?.data ?? { message: "OK" };

      // Guard: treat non-2xx as failure even if client didn't throw
      if (statusCode >= 400) {
        throw new Error(summarizeRequestError({ response }, requestUrl));
      }

      return {
        status: "success",
        responseTime: `${durationMs}ms`,
        statusCode,
        contentType,
        sampleData,
      };
    } catch (error) {
      // CHANGED: concise, actionable error without dumping HTML
      const concise = summarizeRequestError(error, url);
      throw new Error(`Connection test failed: ${concise}`);
    }
  };

  // discovers available API endpoints and returns them as data sources
  const getDataSources = async () => {
    console.log("[CustomApiAdapter] getDataSources called", {
      isConnected,
      isDemoMode,
    });
    if (!isConnected) {
      throw new Error("Not connected to any API");
    }

    // Optionally map provided options.endpoints into data sources if present
    if (options?.endpoints && currentConnection) {
      const entries = [];
      Object.entries(options.endpoints).forEach(([key, value]) => {
        if (!value) return;
        // value may be an object with path/method or a string path
        const path = typeof value === "string" ? value : value.path || "/";
        const method =
          typeof value === "string" ? "GET" : value.method || "GET";
        entries.push({
          id: `${currentConnection.id}_${key}`,
          name: `${currentConnection.name} - ${key}`,
          path,
          method,
          type: "endpoint",
          lastModified: currentConnection.lastTested,
          url: currentConnection.url,
        });
      });
      if (entries.length) return entries;
    }

    // Real implementation would discover actual endpoints
    return [
      {
        id: `${currentConnection.id}_default`,
        name: `${currentConnection.name} - Default Endpoint`,
        path: "/",
        method: "GET",
        type: "endpoint",
        lastModified: currentConnection.lastTested,
        url: currentConnection.url,
      },
    ];
  };

  // fetches raw data from API endpoints with real HTTP calls
  const fetchRawData = async (endpoint = "/", method = "GET", params = {}) => {
    console.log("[CustomApiAdapter] fetchRawData called", {
      endpoint,
      method,
      isDemoMode,
    });
    if (!isConnected) {
      throw new Error("Not connected to any API");
    }

    try {
      const parsedHeaders = parseHeaders(currentConnection.headers);
      const auth = parseAuthentication(currentConnection.authentication);

      const baseHeaders = {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...parsedHeaders,
      };

      const hdrConfig = applyAuthentication({ headers: baseHeaders }, auth);
      const headers = hdrConfig.headers || baseHeaders;

      const upper = String(method).toUpperCase();
      const isGet = upper === "GET";
      const url = buildApiUrl(
        currentConnection.url,
        endpoint,
        isGet ? params : {}
      );

      if (isGet) {
        const res = await apiClient.get(url, {
          headers,
          timeout: 30000,
          params: {},
        });
        return res?.data;
      }

      if (upper === "POST" && typeof apiClient.post === "function") {
        const res = await apiClient.post(url, params, {
          headers,
          timeout: 30000,
        });
        return res?.data;
      }
      if (upper === "PUT" && typeof apiClient.put === "function") {
        const res = await apiClient.put(url, params, {
          headers,
          timeout: 30000,
        });
        return res?.data;
      }
      if (upper === "PATCH" && typeof apiClient.patch === "function") {
        const res = await apiClient.patch(url, params, {
          headers,
          timeout: 30000,
        });
        return res?.data;
      }
      if (upper === "DELETE" && typeof apiClient.delete === "function") {
        const res = await apiClient.delete(url, {
          headers,
          timeout: 30000,
          params: {},
        });
        return res?.data;
      }

      throw new Error(`HTTP method not supported by apiClient: ${upper}`);
    } catch (error) {
      throw error;
    }
  };

  const getConnectionInfo = () => ({
    isConnected,
    connection: currentConnection,
    provider: "Custom API",
    dataSourceCount: connections.length,
    isDemoMode: false,
    demoConfig: null,
  });

  const switchConnection = async (connectionId) => {
    await simulateDelay("connect");

    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    currentConnection = connection;
    isConnected = true;

    console.log(`Switched to connection: ${connection.name}`);
    return { connected: true, connection };
  };

  const updateConnection = async (connectionId, updates) => {
    // Real implementation would update via API
    return { connected: true };
  };

  const deleteConnection = async (connectionId) => {
    // Real implementation would delete via API
    return { connected: true };
  };

  const filterDataSources = (query, dataSources = []) => {
    if (!query) return dataSources;
    return dataSources.filter(
      (source) =>
        source.name.toLowerCase().includes(query.toLowerCase()) ||
        source.path.toLowerCase().includes(query.toLowerCase()) ||
        source.type.toLowerCase().includes(query.toLowerCase())
    );
  };

  // returns current demo mode status and configuration for UI display
  const getDemoStatus = () => ({
    isDemoActive: false,
    config: null,
    showIndicators: false,
    connectionCount: connections.length,
  });

  // cleans up resources and event listeners when adapter is destroyed
  const destroy = () => {
    if (configUnsubscribe) {
      configUnsubscribe();
    }
    currentConnection = null;
    connections = [];
    isConnected = false;
    console.log("Custom API Adapter destroyed");
  };

  return {
    // primary methods for managing API connections
    connect,
    disconnect,
    testConnection,
    isConnected: () => isConnected,
    getConnectionInfo,
    switchConnection,
    updateConnection,
    deleteConnection,

    // methods for discovering and fetching data from API endpoints
    getDataSources,
    filterDataSources,
    fetchRawData,

    // helper functions for parsing and building API requests
    parseHeaders,
    parseAuthentication,
    applyAuthentication,
    buildApiUrl,
    formatDate,

    // methods for managing demo mode behavior and status
    getDemoStatus,
    simulateDelay,

    // resource cleanup method
    destroy,
  };
};
