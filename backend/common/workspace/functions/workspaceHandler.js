// Author(s): Rhys Cleary
const cancelInvite = require("./services/invites/cancelInvite");
const getSentInvites = require("./services/invites/getSentInvites");
const inviteUser = require("./services/invites/inviteUser");
const createWorkspace = require("./services/workspace/createWorkspace");
const deleteWorkspace = require("./services/workspace/deleteWorkspace");
const getWorkspaceById = require("./services/workspace/getWorkspaceById");
const updateWorkspace = require("./services/workspace/updateWorkspace");

exports.handler = async (event) => {
    let statusCode = 200;
    let body;
    
    try {
        const requestJSON = event.body ? JSON.parse(event.body) : {};
        const pathParams = event.pathParameters || {};
        const userId = event.requestContext.authorizer.claims.sub;

        if (!userId) {
            throw new Error("User not authenticated");
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
            // CREATE WORKSPACE
            case "POST /workspace": {
                body = await createWorkspace(userId, requestJSON);
                break;
            }

            // UPDATE WORKSPACE
            case "PUT /workspace/{workspaceId}": {
                body = await updateWorkspace(userId, pathParams.workspaceId, requestJSON);
                break;
            }

            // GET WORKSPACE BY ID
            case "GET /workspace/{workspaceId}": {
                body = await getWorkspaceById(pathParams.workspaceId);
                break;
            }

            // DELETE WORKSPACE
            case "DELETE /workspace/{workspaceId}": {
                body = await deleteWorkspace(userId, pathParams.workspaceId);
                break;
            }

            // TODO:

            // INVITE USER
            case "POST /workspace/{workspaceId}/invites/create": {
                body = await inviteUser(userId, pathParams.workspaceId, requestJSON);
                break;
            }

            // CANCEL INVITE
            case "DELETE /workspace/{workspaceId}/invites/cancel/{email}": {
                body = await cancelInvite(userId, pathParams.workspaceId, pathParams.email);
                break;
            }

            // VIEW SENT INVITES FOR WORKSPACE
            case "GET /workspace/{workspaceId}/invites": {
                body = await getSentInvites(userId, pathParams.workspaceId);
                break;
            }



            // ADD USER TO WORKSPACE
            case "POST /workspace/{workspaceId}/users/add": {
                body = await deleteWorkspace(userId, pathParams.workspaceId, requestJSON);
                break;
            }

            // UPDATE USER IN WORKSPACE
            case "PUT /workspace/{workspaceId}/users/update/{userId}": {
                body = await deleteWorkspace(userId, pathParams.workspaceId, pathParams.userId);
                break;
            }

            // REMOVE USER FROM WORKSPACE
            case "DELETE /workspace/{workspaceId}/users/remove/{userId}": {
                body = await deleteWorkspace(userId, pathParams.workspaceId, pathParams.userId);
                break;
            }

            // GET ALL USERS IN WORKSPACE
            case "GET /workspace/{workspaceId}/users": {
                body = await deleteWorkspace(userId, pathParams.workspaceId);
                break;
            }


            // CREATE ROLE
            // UPDATE ROLE
            // DELETE ROLE


            // TODO MODULES:
            
            
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