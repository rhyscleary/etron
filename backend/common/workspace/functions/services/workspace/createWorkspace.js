// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const { getUserById } = require("../utils/auth");
const workspaceTable = "Workspaces";
const workspaceUsersTable = "WorkspaceUsers";

async function createWorkspace(userId, data) {
    if (!data.name) {
        throw new Error("Missing required field: 'name'");
    }

    const workspaceId = uuidv4();
    const date = new Date().toISOString();

    // create a new workspace item
    const workspaceItem = {
        workspaceId: workspaceId,
        sk: "meta",
        name: data.name,
        location: data.location || null,
        description: data.description || null,
        ownerId: userId,
        createdAt: date,
        updatedAt: date
    };

    await dynamoDB.send(
        new PutCommand( {
            TableName: workspaceTable,
            Item: workspaceItem
        })
    );

    // search modules and add defaults to workspace
    

    // add user as an owner of the workspace
    // get cognito user by sub
    const userProfile = await getUserById(userId);

    await dynamoDB.send(
        new PutCommand( {
            TableName: workspaceUsersTable,
            Item: {
                workspaceId: workspaceId,
                userId: userId,
                email: userProfile.email,
                preferred_username: userProfile.preferred_username,
                given_name: userProfile.given_name,
                family_name: userProfile.family_name,
                type: "owner",
                role: "owner",
                joinedAt: date,
                updatedAt: date
            },
        })
    );

    return {
        workspaceId: workspaceId,
        name: data.name,
        location: data.location || null,
        description: data.description || null,
        ownerId: userId,
        createdAt: date,
        updatedAt: date
    };
}

module.exports = createWorkspace;