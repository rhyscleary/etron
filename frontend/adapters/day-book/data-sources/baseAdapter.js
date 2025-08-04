// utility functions can be used across different adapters
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const validateSourceId = (sourceId) => {
  if (!sourceId) {
    throw new Error("Source ID is required");
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

export const validateConnectionData = (connectionData, requiredFields) => {
  const missing = requiredFields.filter(
    (field) => !connectionData[field]?.trim()
  );
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

export const sanitizeConnectionData = (connectionData) => {
  const sanitized = {};
  Object.keys(connectionData).forEach((key) => {
    const value = connectionData[key];
    if (typeof value === "string") {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

export const createConnectionId = (type, connectionData) => {
  const timestamp = Date.now();
  const identifier =
    connectionData.name ||
    connectionData.url ||
    connectionData.hostname ||
    "connection";
  const sanitized = identifier.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `${type}-${sanitized}-${timestamp}`;
};

export const validateUrl = (url) => {
  try {
    const parsed = new URL(url);
    return {
      isValid: true,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

export const createTestResult = (success, data = {}, error = null) => {
  return {
    status: success ? "success" : "error",
    timestamp: new Date().toISOString(),
    data: success ? data : null,
    error: error ? error.message || error : null,
    ...data,
  };
};
