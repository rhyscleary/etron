// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { isOwner, isManager } = require("../utils/permissions");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const workspaceUsersTable = "WorkspaceUsers";

async function updateUser(authUserId, workspaceId, userId, data) {

    if (! await isOwner(authUserId, workspaceId) && ! await isManager(authUserId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    const user = await dynamoDB.send(
        new GetCommand( {
            TableName: workspaceUsersTable,
            Key: {
                workspaceId: workspaceId,
                userId: userId
            },
        })
    );

    if (!user.Item) {
        throw new Error("User not found");
    }

    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.type !== undefined) {
        // check if valid type


        updateFields.push("#type = :type");
        expressionAttributeValues[":type"] = data.type;
        expressionAttributeNames["#type"] = "type";
    }

    if (data.role !== undefined) {
        // check if the role exists in the workspace
        

        updateFields.push("#role = :role");
        expressionAttributeValues[":role"] = data.role;
        expressionAttributeNames["#role"] = "role";
    }

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    await dynamoDB.send(
        new UpdateCommand( {
            TableName: workspaceUsersTable,
            Key: {
                workspaceId: workspaceId,
                userId: userId
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames
        })
    );

    return {message: "User updated successfully"};
}

module.exports = updateUser;