// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const getInvite = require("../invites/getInvite");
const { getUserByEmail } = require("../utils/auth");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const workspaceUsersTable = "WorkspaceUsers";

async function addUser(workspaceId, inviteId) {
    if (!workspaceId || !inviteId) {
        throw new Error("Missing required path params");
    }

    // get invite
    const invite = await getInvite(workspaceId, inviteId);

    if (!invite) {
        throw new Error("Invite not found");
    }

    // get cognito user by email
    const userProfile = await getUserByEmail(invite.email);

    const date = new Date().toISOString();
    
    // create a new user item
    const userItem = {
        workspaceId: workspaceId,
        userId: userProfile.userId,
        email: userProfile.email,
        preferred_username: userProfile.preferred_username,
        given_name: userProfile.given_name,
        family_name: userProfile.family_name,
        type: invite.type,
        role: invite.role || null,
        joinedAt: date,
        updatedAt: date
    };

    await dynamoDB.send(
        new PutCommand( {
            TableName: workspaceUsersTable,
            Item: userItem
        })
    );

    return userItem;

}

module.exports = addUser;