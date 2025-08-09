// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner, isManager } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const workspaceUsersTable = "WorkspaceUsers";

async function getUser(authUserId, workspaceId, userId) {
    if (!workspaceId || !userId) {
        throw new Error("Missing required path parameters");
    }

    // find the user in a workspace
    const result = await dynamoDB.send(
            new GetCommand({
                TableName: workspaceUsersTable,
                Key: {
                    workspaceId: workspaceId,
                    userId: userId
                }
            })
        );

    return result.Item || [];
    
}

module.exports = getUser;