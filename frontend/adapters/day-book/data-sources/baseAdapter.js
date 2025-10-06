/**
 * Base adapter utilities
 * Shared helper functions for all data source adapters
 */

/**
 * Delays execution for a specified number of milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validates that a source ID is provided and is a non-empty string
 * @param {string} sourceId - The source ID to validate
 * @throws {Error} If sourceId is missing or invalid
 */
export const validateSourceId = (sourceId) => {
  if (!sourceId || typeof sourceId !== "string" || sourceId.trim() === "") {
    throw new Error("Invalid or missing source ID");
  }
};

/**
 * Formats a date object or ISO string into a human-readable format
 * @param {Date|string} date - The date to format
 * @param {Object} options - Formatting options
 * @param {string} options.format - Format type: 'short', 'long', 'iso' (default: 'short')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const { format = "short" } = options;

  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  switch (format) {
    case "iso":
      return dateObj.toISOString();
    case "long":
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    case "short":
    default:
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
  }
};

/**
 * Validates connection status
 * @param {boolean} isConnected - Connection status
 * @param {string} adapterName - Name of the adapter for error messages
 * @throws {Error} If not connected
 */
export const validateConnection = (isConnected, adapterName = "Adapter") => {
  if (!isConnected) {
    throw new Error(`${adapterName} is not connected. Please connect first.`);
  }
};

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code (optional)
 * @returns {Object} Error object
 */
export const createError = (message, code = "ADAPTER_ERROR") => {
  return {
    success: false,
    error: message,
    code,
  };
};

/**
 * Creates a standardized success response
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} Success object
 */
export const createSuccess = (data, message = null) => {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
};
