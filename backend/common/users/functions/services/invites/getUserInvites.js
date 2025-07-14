const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const invitesTable = "WorkspaceInvites";

async function getUserInvites(email) {

    const result = await dynamoDB.send(
        new GetCommand( {
            TableName: invitesTable,
            Key: {
                pk: workspaceId,
            },
        })
    );

    if (!result.Item) {
        throw new Error("Workspace not found");
    }

    const item = result.Item;

    return {
        workspace: {
            workspaceId: item.workspaceId,
            name: item.name,
            location: item.location || null,
            description: item.description || null,
            ownerId: item.ownerId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }
    };
}

module.exports = getUserInvites;