// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const { isOwner, isManager } = require("../utils/permissions");
const workspaceUsersTable = "WorkspaceUsers";

async function removeUser(authUserId, workspaceId, userId) {

    if (! await isOwner(authUserId, workspaceId) && ! await isManager(authUserId, workspaceId)) {
        throw new Error("User does not have permission to perform action")
    }

    // check if the user exists
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

    // check if the user is the workspace owner
    if (user.Item.type === "owner") {
        throw new Error("The owner cannot be removed");
    }

    await dynamoDB.send(
        new DeleteCommand( {
            TableName: workspaceUsersTable,
            Key: {
                workspaceId: workspaceId,
                userId: userId
            },
        })
    );

    return {message: "User successfully removed"};
}

module.exports = removeUser;