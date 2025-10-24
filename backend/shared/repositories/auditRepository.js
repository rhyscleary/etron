// Author(s): Rhys Cleary
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
    DynamoDBDocumentClient, 
    PutCommand, 
    QueryCommand,
    BatchWriteCommand 
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "AuditLogs";

// add log
async function addLog(logItem) {
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: logItem
        })
    );
}

// remove all the logs
async function removeAllLogs(workspaceId) {
    const { Items } = await dynamoDB.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "workspaceId = :workspaceId",
        ExpressionAttributeValues: { ":workspaceId": workspaceId }
    }));

    if (!Items || Items.length === 0) return;

    // batch delete the items
    const deleteRequests = Items.map(item => ({
        DeleteRequest: { Key: { workspaceId, logId: item.logId } }
    }));

    for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);
        await dynamoDB.send(new BatchWriteCommand({
            RequestItems: { [tableName]: batch }
        }));
  }
}

// get user logs (by userId)
async function getLogsByUserId(workspaceId, userId, limit = 50, lastKey = null) {
    const params = {
        TableName: tableName,
        IndexName: "UserLogsIndex",
        KeyConditionExpression: "userId = :userId AND workspaceId = :workspaceId",
        ExpressionAttributeValues: {
            ":userId": userId,
            ":workspaceId": workspaceId,
        },
        Limit: limit,
        ScanIndexForward: false,
    };
    if (lastKey) params.ExclusiveStartKey = lastKey;

    const result = await dynamoDB.send(new QueryCommand(params));
    return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
}

// get logs by workspaceId
async function getLogsByWorkspaceId(workspaceId, limit = 50, lastKey = null) {
    const params = {
        TableName: tableName,
        KeyConditionExpression: "workspaceId = :workspaceId",
        ExpressionAttributeValues: { ":workspaceId": workspaceId },
        Limit: limit,
        ScanIndexForward: false,
    }
    if (lastKey) params.ExclusiveStartKey = lastKey;

    const result = await dynamoDB.send(new QueryCommand(params));
    return { items: result.Items || [], lastKey: result.LastEvaluatedKey || null };
}

module.exports = {
    addLog,
    getLogsByUserId,
    getLogsByWorkspaceId,
    removeAllLogs
}