// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const workspaceTable = "Workspaces";
const usersTable = "WorkspaceUsers";

async function createWorkspace(userId, data) {
    if (!data.name) {
        throw new Error("Missing required field: 'name'");
    }

    const workspaceId = uuidv4();
    const date = new Date().toISOString();

    // create a new workspace item
    await dynamoDB.send(
        new PutCommand( {
            TableName: workspaceTable,
            Item: {
                workspaceId: workspaceId,
                sk: "meta",
                name: data.name,
                location: data.location || null,
                description: data.description || null,
                ownerId: userId,
                createdAt: date,
                updatedAt: date
            },
        })
    );

    // search modules and add defaults to workspace


    // add user as an owner of the workspace
    const sk = `user#${userId}`;

    await dynamoDB.send(
        new PutCommand( {
            TableName: usersTable,
            Item: {
                workspaceId: workspaceId,
                sk: sk,
                type: "Owner",
                role: "Owner",
                joinedAt: date
            },
        })
    );


    return {message: "Workspace created successfully", workspaceId: workspaceId};
}

module.exports = createWorkspace;