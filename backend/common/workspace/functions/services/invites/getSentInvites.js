// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner, isManager } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const invitesTable = "WorkspaceInvites";

async function getSentInvites(userId, workspaceId) {
    if (!workspaceId) {
        throw new Error("Missing required path parameters");
    }

    if (! await isOwner(userId, workspaceId) && ! await isManager(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    // find all invites associated with a workspace
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: invitesTable,
                KeyConditionExpression: "workspaceId = :w",
                ExpressionAttributeValues: {
                    ":w": workspaceId
                }
            })
        );

    return result.Items || [];
    
}

module.exports = getSentInvites;