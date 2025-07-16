// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner, isManager } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const workspaceTable = "Workspaces";

async function getRoles(userId, workspaceId) {
    if (!workspaceId) {
        throw new Error("Missing required path parameters");
    }

    if (! await isOwner(userId, workspaceId) && ! await isManager(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    // get the roles in a workspace
    const result = await dynamoDB.send(
            new QueryCommand({
                TableName: workspaceTable,
                KeyConditionExpression: "workspaceId = :workspaceId AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":workspaceId": workspaceId,
                    ":prefix": "role#"
                }
            })
        );

    return (result.Items || []).map(({sk, ...rest}) => ({
        ...rest,
        roleId: sk.replace("role#", "")
    }));
    
}

module.exports = getRoles;