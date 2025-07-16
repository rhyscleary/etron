const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const invitesTable = "WorkspaceInvites";

async function getUserInvites(email) {

    const result = await dynamoDB.send(
        new QueryCommand({
            TableName: invitesTable,
            IndexName: "email-index",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        })
    );

    return result.Items || [];

}

module.exports = getUserInvites;