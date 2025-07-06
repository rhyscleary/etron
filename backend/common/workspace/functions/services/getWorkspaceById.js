const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "Workspaces";

async function getWorkspaceById(workspaceId) {

    const result = await dynamoDB.send(
        new GetCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                type: "workspace"
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

module.exports = getWorkspaceById;