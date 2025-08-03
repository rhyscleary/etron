const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "Workspaces";

async function getWorkspaceByUserId(authUserId) {
    // get user data
    const user = await dynamoDB.send(
        new QueryCommand({
            TableName: workspaceUsersTable,
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": authUserId
            }
        })
    );
    
    if (!user.Item) {
        throw new Error("No user found");
    }

    const userItem = user.Item;

    // get workspace data
    const workspace = await dynamoDB.send(
        new GetCommand( {
            TableName: tableName,
            Key: {
                workspaceId: userItem.workspaceId,
                sk: "meta"
            },
        })
    );

    if (!workspace.Item) {
        throw new Error("Workspace not found");
    }

    const workspaceItem = workspace.Item;

    return {
        workspaceId: workspaceItem.workspaceId,
        name: workspaceItem.name,
        location: workspaceItem.location || null,
        description: workspaceItem.description || null,
        ownerId: workspaceItem.ownerId,
        createdAt: workspaceItem.createdAt,
        updatedAt: workspaceItem.updatedAt
    };
}

module.exports = getWorkspaceByUserId;