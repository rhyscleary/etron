// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand} = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const { isOwner, isManager } = require("../utils/permissions");
const invitesTable = "WorkspaceInvites";

async function cancelWorkspaceInvite(userId, workspaceId, inviteId) {
    if (!workspaceId || !inviteId) {
        throw new Error("Missing required parameters");
    }

    if (! await isOwner(userId, workspaceId) && ! await isManager(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    // find invites with email
    const result = await dynamoDB.send(
        new GetCommand( {
            TableName: invitesTable,
            Key: {
                workspaceId: workspaceId,
                inviteId: inviteId
            }
        })
    );

    if (!result.Item) {
        throw new Error("No workspace invitation found");
    }

    const item = result.Item;

    // delete invite
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: invitesTable,
            Key: {
                workspaceId: item.workspaceId,
                inviteId: item.inviteId
            },
        })
    );
    
    return {message: "Invite cancelled"}
    
}

module.exports = cancelWorkspaceInvite;