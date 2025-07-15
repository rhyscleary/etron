// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const { isOwner, isManager } = require("../utils/permissions");
const workspaceTable = "Workspaces";

async function deleteRole(userId, workspaceId, roleId) {
    if (!workspaceId || !roleId) {
        throw new Error("Missing required path parameters");
    }

    if (! await isOwner(userId, workspaceId) && ! await isManager(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    const role = await dynamoDB.send(
        new GetCommand( {
            TableName: workspaceTable,
            Key: {
                workspaceId: workspaceId,
                sk: `role#${roleId}`
            },
        })
    );

    if (!role.Item) {
        throw new Error("Role not found");
    }

    await dynamoDB.send(
        new DeleteCommand( {
            TableName: workspaceTable,
            Key: {
                workspaceId: workspaceId,
                sk: `role#${roleId}`
            },
        })
    );

    return {message: "Role successfully deleted"}
}

module.exports = deleteRole;