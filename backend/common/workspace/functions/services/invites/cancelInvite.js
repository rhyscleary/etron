// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand} = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const { isOwner, isManager } = require("../utils/permissions");
const invitesTable = "WorkspaceInvites";

async function cancelInvite(userId, workspaceId, email) {
    if (!workspaceId || !email) {
        throw new Error("Missing required parameters");
    }

    if (! await isOwner(userId, workspaceId) && ! await isManager(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    // find invite with email
    const result = await dynamoDB.send(
        new QueryCommand( {
            TableName: invitesTable,
            IndexName: "workspaceId-email-index",
            KeyConditionExpression: "workspaceId = :w AND email = :e",
            ExpressionAttributeValues: {
                ":w": workspaceId,
                ":e": email
            }
        })
    );

    if (!result.Items) {
        throw new Error("No invitation found");
    }

    const items = result.Items;

    // delete invite
    for (let item of items) {
        await dynamoDB.send(
            new DeleteCommand( {
                TableName: invitesTable,
                Key: {
                    workspaceId: item.workspaceId,
                    inviteId: item.inviteId
                },
            })
        );
    }
    
    return {message: "Invite(s) cancelled"}
    
}

module.exports = cancelInvite;