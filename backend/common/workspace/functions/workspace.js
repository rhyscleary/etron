// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const {v4 : uuidv4} = require('uuid');
const tableName = "Workspaces";

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
            // CREATE WORKSPACE
            case "CREATE /workspace": {

                if (!requestJSON.name) {
                    throw new Error("Missing required field: 'name'");
                }

                const id = uuidv4();
                
                const date = new Date().toISOString();

                // search modules table and add defaults to workspace

                // create a new workspace item
                await dynamoDB.send(
                    new PutCommand( {
                        TableName: tableName,
                        Item: {
                            workspaceId: id,
                            type: "workspace",
                            name: requestJSON.name,
                            location: requestJSON.location || null,
                            description: requestJSON.description || null,
                            ownerId: userId,
                            createdAt: date,
                            updatedAt: date,
                            modules: []
                        },
                    })
                );


                body = {message: "Workspace created successfully", workspaceId: id};
                break;
            }

            // UPDATE WORKSPACE
            case "PUT /workspace/{id}": {
                // got to finish writing this
                const id = pathParams.id;

                const result = await dynamoDB.send(
                    new GetCommand( {
                        TableName: tableName,
                        Key: {
                            PK: pk,
                            SK: "workspace"
                        },
                    })
                );

                await dynamoDB.send(
                    new UpdateCommand( {
                        TableName: tableName,
                        Item: {
                            workspaceId: id,
                            name: requestJSON.name,
                            location: requestJSON.location,
                            ownerId: requestJSON.ownerId
                        },
                    })
                );

                body = {message: "Workspace updated successfully"};
                break;
            }

            // GET WORKSPACE BY ID
            case "GET /workspace/{id}": {
                const id = pathParams.id;

                const result = await dynamoDB.send(
                    new GetCommand( {
                        TableName: tableName,
                        Key: {
                            workspaceId: id,
                            type: "workspace"
                        },
                    })
                );

                if (!result.Item) {
                    throw new Error("Workspace not found");
                }

                const item = result.Item;

                body = {
                    workspace: {
                        id: item.PK.replace("workspace#", ""),
                        name: item.name,
                        location: item.location || null,
                        description: item.description || null,
                        ownerId: item.ownerId,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        modules: item.modules || []
                    }
                };
                break;
            }

            // DELETE WORKSPACE
            case "DELETE /workspace/{id}": {
                const id = pathParams.id;

                const workspace = await dynamoDB.send(
                    new GetCommand( {
                        TableName: tableName,
                        Key: {
                            workspaceId: workspace,
                            type: "workspace"
                        },
                    })
                );

                if (!workspace.Item) {
                    throw new Error("Workspace not found");
                }

                if (userId !== workspace.Item.ownerId) {
                    throw new Error("Unauthorised user");
                }

                await dynamoDB.send(
                    new DeleteCommand( {
                        TableName: tableName,
                        Key: {
                            workspace: id,
                            type: "workspace"
                        },
                    })
                );

                body = {message: "Workspace successfully deleted"}
                break;
            }

            // ADD MODULE
            
            // REMOVE MODULE

            // GET MODULES INSTALLED
            case "GET /workspace/{id}/modules": {
                const id = pathParams.id;
                const pk = `workspace#${id}`;

                const result = await dynamoDB.send(
                    new GetCommand({
                        TableName: tableName,
                        Key: {
                            PK: pk,
                            SK: "workspace"
                        }
                    }));

                if (!result.Item) {
                    throw new Error("Workspace not found");
                }

                body = {modules: result.Item.modules || []}
                break;
            }

            // ENABLE MODULE
            // DISABLE MODULE
            
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