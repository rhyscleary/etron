// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const { isOwner, isManager } = require("../utils/permissions");

const workspaceTable = "Workspaces";

async function createRole(userId, workspaceId, data) {
    if (!data.name || !data.permissions) {
        throw new Error("Missing required fields");
    }

    if (! await isOwner(userId, workspaceId) && ! await isManager(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    const roleId = uuidv4();
    const date = new Date().toISOString();
    
    // create a new role item
    const roleItem = {
        workspaceId: workspaceId,
        sk: `role#${roleId}`,
        name: data.name,
        permissions: data.permissions,
        createdAt: date,
        updatedAt: date
    };

    await dynamoDB.send(
        new PutCommand( {
            TableName: workspaceTable,
            Item: roleItem
        })
    );

    return {
        roleId: roleId,
        name: data.name,
        permissions: data.permissions,
        createdAt: date,
        updatedAt: date
    };
}

module.exports = createRole;