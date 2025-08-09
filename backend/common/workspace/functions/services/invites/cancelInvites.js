// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand} = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const { isOwner, isManager } = require("../utils/permissions");
const invitesTable = "WorkspaceInvites";

async function cancelInvites(email) {
    if (!email) {
        throw new Error("Missing required parameters");
    }

    // find invites with email
    const result = await dynamoDB.send(
        new QueryCommand( {
            TableName: invitesTable,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        })
    );

    if (!result.Items) {
        throw new Error("No workspace invitations found");
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
    
    return {message: "Invites cancelled"}
    
}

module.exports = cancelInvites;