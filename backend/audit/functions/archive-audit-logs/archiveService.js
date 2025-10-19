// Author(s): Rhys Cleary

const {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const dynamo = new DynamoDBClient({});
const s3 = new S3Client({});

const TABLE_NAME = "AuditLogs";
const BUCKET_NAME = process.env.WORKSPACE_BUCKET;
// declare time in seconds
const ONE_DAY = 24 * 60 * 60;
const THIRTY_DAYS = 30 * ONE_DAY;

// Helper to read stream to string
async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

async function archiveExpiredAuditLogs() {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - (THIRTY_DAYS - ONE_DAY); // ~29 days old

  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: "createdAt <= :cutoff",
    ExpressionAttributeValues: { ":cutoff": cutoff },
  };

  let lastKey = null;
  let archivedCount = 0;

  do {
    const data = await dynamo.send(
      new ScanCommand({ ...scanParams, ExclusiveStartKey: lastKey })
    );

    if (!data.Items || !data.Items.length) break;

    // group by workspace and user
    const grouped = {};
    for (const item of data.Items) {
      const workspaceId = item.workspaceId;
      const userId = item.userId;
      if (!workspaceId) continue;

      const key = userId
        ? `user-${workspaceId}-${userId}`
        : `workspace-${workspaceId}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        logId: item.logId,
        userId,
        action: item.action,
        timestamp: item.timestamp,
        type: item.type,
        details: item.details ? JSON.parse(item.details) : {},
      });
    }

    // upload grouped logs
    for (const [key, logs] of Object.entries(grouped)) {
      const [type, workspaceId, userId] = key.split("-");
      const s3Key =
        type === "workspace"
          ? `workspaces/${workspaceId}/audits/workspace/${workspaceId}.json`
          : `workspaces/${workspaceId}/audits/users/${userId}.json`;

      let existingLogs = [];
      try {
        const existingObj = await s3.send(
          new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })
        );
        const existingData = await streamToString(existingObj.Body);
        existingLogs = JSON.parse(existingData);
        if (!Array.isArray(existingLogs)) existingLogs = [];
      } catch (err) {
        if (err.name !== "NoSuchKey") console.error(`Error reading ${s3Key}:`, err);
      }

      const combined = [...existingLogs, ...logs];

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(combined, null, 2),
          ContentType: "application/json",
          StorageClass: "GLACIER",
        })
      );

      archivedCount += logs.length;
    }

    // delete after archiving
    for (const item of data.Items) {
      await dynamo.send(
        new DeleteItemCommand({
          TableName: TABLE_NAME,
          Key: {
            workspaceId: item.workspaceId,
            logId: item.logId,
          },
        })
      );
    }

    lastKey = data.LastEvaluatedKey;
  } while (lastKey);

  return { archivedCount };
}

module.exports = { archiveExpiredAuditLogs };