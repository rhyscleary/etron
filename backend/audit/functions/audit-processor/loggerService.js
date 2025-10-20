// Author(s): Rhys Cleary
const { v4: uuidv4 } = require("uuid");
const auditRepo = require("@etron/audit-shared/repositories/auditRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");

// audit logger
/*async function logAuditEvent({ 
  workspaceId, 
  userId, 
  action,  
  filters = [],
  module,
  itemType,
  itemId,
  itemName,
  details = {},
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
    await auditRepo.addLog(logItem); // add to database
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}*/

async function processAuditEventBatch(event) {
    const results = await Promise.allSettled(
        event.Records.map(async (record) => {
            const body = parseMessage(record);
            if (!body) return;

            const { workspaceId, userId, action } = body;
            if (!workspaceId || !userId || !action) {
                console.warn("Invalid audit event: missing workspaceId, userId, or action.", body);
                return;
            }

            const user = await workspaceUsersRepo.getUser(workspaceId, userId);
            if (user) {
                body.userGivenName = user.given_name;
                body.userFamilyName = user.family_name;
            }

            const now = Math.floor(Date.now() / 1000);
            const logItem = {
                ...body,
                logId: body.logId || uuidv4(),
                timestamp: body.timestamp || new Date().toISOString(),
                createdAt: body.createdAt || now,
            };

            await auditRepo.addLog(logItem);
        })
    );

    return results.reduce(
        (acc, result) => {
            acc[result.status === "fulfilled" ? "success" : "failed"]++;
            return acc;
        },
        { success: 0, failed: 0 }
    );
}

function parseMessage(record) {
  try {
    return JSON.parse(record.body);
  } catch (error) {
    console.error("Failed to parse SQS message body:", record.body, error);
    return null;
  }
}

module.exports = { processAuditEventBatch };