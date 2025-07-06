const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "Workspaces";

async function removeWorkspaceModule(workspaceId, moduleId) {

    const sk = `module#${moduleId}`;

    const module = await dynamoDB.send(
        new GetCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                type: sk
            },
        })
    );

    if (!module.Item) {
        throw new Error("Module not installed in workspace");
    }

    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                type: sk
            },
        })
    );

    return {message: "Module removed from workspace"}
}

module.exports = removeWorkspaceModule;