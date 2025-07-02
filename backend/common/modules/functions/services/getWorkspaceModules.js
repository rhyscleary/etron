// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "Workspaces";

async function getWorkspaceModules(workspaceId) {

    const result = await dynamoDB.send(
        new QueryCommand( {
            TableName: tableName,
            KeyConditionExpression: "workspaceId = :workspaceId AND begins_with(type, :prefix)",
            ExpressionAttributeValues: {
                ":workspaceId": workspaceId,
                ":prefix": "module#"
            }
        })
    );

    if (!result.Items) {
        throw new Error("No modules found");
    }

    return {modules: result.Items || []};
}

module.exports = getWorkspaceModules;