// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "Workspaces";

async function updateWorkspace(userId, workspaceId, data) {

    if (! await isOwner(userId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    const workspace = await dynamoDB.send(
        new GetCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: "meta"
            },
        })
    );

    if (!workspace.Item) {
        throw new Error("Workspace not found");
    }

    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = data.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (data.location !== undefined) {
        updateFields.push("#location = :location");
        expressionAttributeValues[":location"] = data.location;
        expressionAttributeNames["#location"] = "location";
    }

    if (data.description !== undefined) {
        updateFields.push("#description = :description");
        expressionAttributeValues[":description"] = data.description;
        expressionAttributeNames["#description"] = "description";
    }

    if (updateFields.length === 0) {
        throw new Error("No fields to update");
    }

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                sk: "meta"
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames
        })
    );

    return {message: "Workspace updated successfully"};
}

module.exports = updateWorkspace;