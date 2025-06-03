// Author: Rhys Cleary

const {DynamoDBClient, PutCommand, GetCommand, DeleteCommand} = require('@aws-sdk/client-dynamodb')
const {v4 : uuidv4} = require('uuid');
const dynamoDB = new DynamoDBClient();
const tableName = "Workspaces"

const handler = async (event, context) => {
    let statusCode = 200;
    let body;
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        switch (event.routeKey) {
            // add a workspace
            case "PUT /workspace":
                let requestJSON = JSON.parse(event.body);
                let id = requestJSON.workspaceId || uuidv4();

                await dynamoDB.send(
                    new PutCommand( {
                        TableName: tableName,
                        Item: {
                            workspaceId: id,
                            name: requestJSON.name,
                            location: requestJSON.location,
                            ownerId: requestJSON.ownerId
                        },
                    })
                );
                body = "Workspace added or updated successfully ${id}";
                break;

            case "GET /workspace":
                break;

            case "DELETE /workspace/{id}":
                break;
            
            default:
                statusCode = 404;
                body = "Unsupported route: ${event.routeKey}"
                break;
        }
    } catch (error) {
        console.error(error);
        statusCode = 400;
        body = error.message;
    }

    return {
        statusCode,
        headers,
        body: JSON.stringify(body),
    };
};

module.exports = { handler };