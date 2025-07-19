// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner, isManager } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const workspaceUsersTable = "WorkspaceUsers";

async function getUsers(userId, workspaceId) {
    if (!workspaceId) {
        throw new Error("Missing required path parameters");
    }

    // find the users in a workspace
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: workspaceUsersTable,
                KeyConditionExpression: "workspaceId = :workspaceId",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId
                }
            })
        );

    return result.Items || [];
    
}

module.exports = getUsers;