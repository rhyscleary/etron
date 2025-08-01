// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
    DynamoDBDocumentClient, 
    PutCommand, 
    GetCommand, 
    DeleteCommand, 
    UpdateCommand,
    QueryCommand 
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "WorkspaceInvites";

// create invite
async function addInvite(inviteItem) {
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: inviteItem
        })
    );
}

// remove invite by inviteId
async function removeInviteById(workspaceId, inviteId) {
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                inviteId: inviteId
            },
        })
    );
}

// get invite by id
async function getInviteById(workspaceId, inviteId) {
    console.log("Fetching invite with:", { workspaceId, inviteId });

    const result = await dynamoDB.send(
        new GetCommand({
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                inviteId: inviteId
            }
        })
    );
    console.log("DynamoDB GetCommand result:", result);
    
    return result.Item;
}

// get invites by email
async function getInvitesByEmail(email) {
    const result = await dynamoDB.send(
        new QueryCommand( {
            TableName: tableName,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        })
    );
    
    return result.Items;
}

// get invites by workspaceId
async function getInvitesByWorkspaceId(workspaceId) {
    const result = await dynamoDB.send(
        new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "workspaceId = :workspaceId",
            ExpressionAttributeValues: {
                ":workspaceId": workspaceId
            }
        })
    );

    return result.Items;
}

// get invites by workspaceId and email
async function getInvitesByWorkspaceIdAndEmail(workspaceId, email) {
    const result = await dynamoDB.send(
        new QueryCommand({
            TableName: tableName,
            IndexName: "workspaceId-email-index",
            KeyConditionExpression: "workspaceId = :workspaceId AND email = :email",
            ExpressionAttributeValues: {
                ":workspaceId": workspaceId,
                ":email": email
            }
        })
    );
    
    return result.Items;
}


module.exports = {
    addInvite,
    removeInviteById,
    getInviteById,
    getInvitesByEmail,
    getInvitesByWorkspaceId,
    getInvitesByWorkspaceIdAndEmail
}