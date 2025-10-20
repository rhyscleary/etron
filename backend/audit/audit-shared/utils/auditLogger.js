// Author(s): Rhys Cleary
const { v4: uuidv4 } = require("uuid");
const { addLog } = require("../repositories/auditRepository");

// audit logger
async function logAuditEvent({ 
  workspaceId, 
  userId, 
  action, 
  details = {}, 
  type = null
}) {
  if (!workspaceId || !userId || !action) {
    console.warn("Missing workspaceId, userId, or action for audit log.");
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  // create new log item
  const logItem = {
    workspaceId,
    logId: uuidv4(),
    userId,
    action,
    timestamp: new Date().toISOString(),
    createdAt: now,
    filters, // define a filter
    module, // day book
    itemType, // metric, data source, etc
    itemId,
    itemName,
    details,
  };

  try {
    await addLog(logItem); // add to database
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

module.exports = { logAuditEvent };