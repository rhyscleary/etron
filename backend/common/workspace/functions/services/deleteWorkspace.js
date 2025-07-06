const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const tableName = "Workspaces";

async function deleteWorkspace(userId, workspaceId) {
    // needs to delete all entries in the table

    const workspace = await dynamoDB.send(
        new GetCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                type: "workspace"
            },
        })
    );

    if (!workspace.Item) {
        throw new Error("Workspace not found");
    }

    if (userId !== workspace.Item.ownerId) {
        throw new Error("Unauthorised user");
    }

    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                type: "workspace"
            },
        })
    );

    return {message: "Workspace successfully deleted"}
}

module.exports = deleteWorkspace;