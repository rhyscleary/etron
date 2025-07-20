// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const { isOwner, isManager } = require("../utils/permissions");

const invitesTable = "WorkspaceInvites";

async function inviteUser(userId, workspaceId, data) {
    if (!data.email || !data.type) {
        throw new Error("Missing required fields");
    }

    if (! await isOwner(userId, workspaceId) && ! await isManager(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    const inviteId = uuidv4();
    const dateObject = new Date();
    const date = dateObject.toISOString();
    const expireAt = Math.floor((dateObject.getTime() + 7 * 24 * 60 * 60 * 1000) / 1000);
    
    // create a new invite item
    const inviteItem = {
        workspaceId: workspaceId,
        inviteId: inviteId,
        email: data.email,
        type: data.type,
        role: data.role || null,
        status: "pending",
        createdAt: date,
        expireAt: expireAt
    };

    await dynamoDB.send(
        new PutCommand( {
            TableName: invitesTable,
            Item: inviteItem
        })
    );

    // send that email a message

    return inviteItem;
}

module.exports = inviteUser;