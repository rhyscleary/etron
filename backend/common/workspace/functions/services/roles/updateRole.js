// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner, isManager } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const workspaceTable = "Workspaces";

async function updateRole(authUserId, workspaceId, roleId, data) {

    if (! await isOwner(authUserId, workspaceId) && ! await isManager(authUserId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    const role = await dynamoDB.send(
        new GetCommand( {
            TableName: workspaceTable,
            Key: {
                workspaceId: workspaceId,
                sk: `role#${roleId}`
            },
        })
    );

    if (!role.Item) {
        throw new Error("Role not found");
    }

    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = data.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (data.permissions !== undefined) {
        updateFields.push("#permissions = :permissions");
        expressionAttributeValues[":permissions"] = data.permissions
        expressionAttributeNames["#permissions"] = "permissions";
    }

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    const result = await dynamoDB.send(
        new UpdateCommand( {
            TableName: workspaceTable,
            Key: {
                workspaceId: workspaceId,
                sk: `role#${roleId}` 
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "ALL_NEW"
        })
    );

    return (result.Attributes || []).map(({sk, ...rest}) => ({
        ...rest,
        roleId: sk.replace("role#", "")
    }));
}

module.exports = updateRole;