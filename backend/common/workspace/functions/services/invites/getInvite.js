// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner, isManager } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const invitesTable = "WorkspaceInvites";

async function getInvite(workspaceId, inviteId) {
    if (!workspaceId || !inviteId) {
        throw new Error("Missing required parameters");
    }

    // find all invites associated with a workspace
    const result = await dynamoDB.send(
            new GetCommand({
                TableName: invitesTable,
                Key: {
                    workspaceId: workspaceId,
                    inviteId: inviteId
                }
            })
        );

    return result.Item || [];
    
}

module.exports = getInvite;