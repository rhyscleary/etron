// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const tableName = "Modules";

const handler = async (event) => {
    let statusCode = 200;
    let body;
    
    try {
        const requestJSON = event.body ? JSON.parse(event.body) : {};
        const pathParams = event.pathParameters || {};
        const userId = event.requestContext.authorizer.claims.sub;

        if (!userId) {
            throw new Error("User not authenticated");
        }

        switch (event.routeKey) {
            // CREATE MODULE
            case "CREATE /modules": {

                if (!requestJSON.name || !requestJSON.description || !requestJSON.icon || typeof requestJSON.default !== "boolean") {
                    throw new Error("Invalid input. Missing fields or incorrect type");
                }

                const id = uuidv4();

                await dynamoDB.send(
                    new PutCommand( {
                        TableName: tableName,
                        Item: {
                            moduleId: id,
                            name: requestJSON.name,
                            description: requestJSON.description,
                            icon: requestJSON.icon,
                            default: requestJSON.default
                        },
                    })
                );
                body = {message: "Module created successfully", moduleId: id};
                break;
            }

            // UPDATE MODULE
            case "PUT /modules/{id}": {
                // got to finish writing this
                const id = pathParams.id;

                await dynamoDB.send(
                    new UpdateCommand( {
                        TableName: tableName,
                        Key: {moduleId: id},


                    })
                );

                body = {message: "Module updated successfully"};
                break;
            }

            // GET ALL MODULES
            case "GET /modules": {

                const result = await dynamoDB.send(new ScanCommand({TableName: tableName}));

                body = {modules: result.Items || []}
                break;
            }

            // DELETE MODULE
            case "DELETE /modules/{id}": {
                const id = pathParams.id;

                await dynamoDB.send(
                    new DeleteCommand( {
                        TableName: tableName,
                        Key: { moduleId: id }
                    })
                );

                body = {message: "Module successfully deleted"}
                break;
            }

            
            default:
                statusCode = 404;
                body = {message: `Unsupported route: ${event.routeKey}`}
                break;
        }
    } catch (error) {
        console.error(error);
        statusCode = 400;
        body = {error: error.message};
    }

    return {
        statusCode,
        body: JSON.stringify(body),
    };
};

module.exports = { handler };