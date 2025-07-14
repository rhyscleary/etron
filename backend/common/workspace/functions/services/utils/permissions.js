// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const workspaceUsersTable = "WorkspaceUsers";

async function isManager(userId, workspaceId) {
    if (!userId) {
        throw new Error("Missing userId");
    }

    if (!workspaceId) {
        throw new Error("Missing workspaceId");
    }

    const result = await dynamoDB.send(
        new GetCommand({
            TableName: workspaceUsersTable,
            Key: {
                workspaceId: workspaceId,
                userId: userId
            }
        })
    );

    return result.Item.type === "manager";
}

async function isOwner(userId, workspaceId) {
    if (!userId) {
        throw new Error("Missing userId");
    }

    if (!workspaceId) {
        throw new Error("Missing workspaceId");
    }

    const result = await dynamoDB.send(
        new GetCommand({
            TableName: workspaceUsersTable,
            Key: {
                workspaceId: workspaceId,
                userId: userId
            }
        })
    );

    return result.Item.type === "owner";
}

module.exports = {
    isManager,
    isOwner
};