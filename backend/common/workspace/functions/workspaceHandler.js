// Author(s): Rhys Cleary

const getSentInvites = require("./services/invites/getSentInvites");
const inviteUser = require("./services/invites/inviteUser");
const createRole = require("./services/roles/createRole");
const deleteRole = require("./services/roles/deleteRole");
const getRoles = require("./services/roles/getRoles");
const addUser = require("./services/users/addUser");
const getUser = require("./services/users/getUser");
const getUsers = require("./services/users/getUsers");
const removeUser = require("./services/users/removeUser");
const updateUser = require("./services/users/updateUser");
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

            // INVITE USER
            case "POST /workspace/{workspaceId}/invites/create": {
                body = await inviteUser(userId, pathParams.workspaceId, requestJSON);
                break;
            }

            // CANCEL INVITE
            /*case "DELETE /workspace/{workspaceId}/invites/cancel/{email}": {
                body = await cancelInvite(userId, pathParams.workspaceId, pathParams.email);
                break;
            }*/

            // VIEW SENT INVITES FOR WORKSPACE
            case "GET /workspace/{workspaceId}/invites": {
                body = await getSentInvites(userId, pathParams.workspaceId);
                break;
            }



            // ADD USER TO WORKSPACE
            case "POST /workspace/{workspaceId}/users/add/{inviteId}": {
                body = await addUser(pathParams.workspaceId, pathParams.inviteId);
                break;
            }

            // UPDATE USER IN WORKSPACE
            case "PUT /workspace/{workspaceId}/users/update/{userId}": {
                body = await updateUser(userId, pathParams.workspaceId, pathParams.userId, requestJSON);
                break;
            }

            // REMOVE USER FROM WORKSPACE
            case "DELETE /workspace/{workspaceId}/users/remove/{userId}": {
                body = await removeUser(userId, pathParams.workspaceId, pathParams.userId);
                break;
            }

            // GET USER IN WORKSPACE
            case "GET /workspace/{workspaceId}/users/{userId}": {
                body = await getUser(userId, pathParams.workspaceId, pathParams.userId);
                break;
            }

            // GET ALL USERS IN WORKSPACE
            case "GET /workspace/{workspaceId}/users": {
                body = await getUsers(userId, pathParams.workspaceId);
                break;
            }


            // CREATE ROLE
            case "POST /workspace/{workspaceId}/roles/create": {
                body = await createRole(userId, pathParams.workspaceId, requestJSON);
                break;
            }

            // UPDATE ROLE
            case "PUT /workspace/{workspaceId}/roles/update/{roleId}": {
                body = await updateRole(userId, pathParams.workspaceId, pathParams.roleId, requestJSON);
                break;
            }

            // DELETE ROLE
            case "DELETE /workspace/{workspaceId}/roles/remove/{roleId}": {
                body = await deleteRole(userId, pathParams.workspaceId, pathParams.roleId);
                break;
            }

            // GET ALL ROLES IN WORKSPACE
            case "GET /workspace/{workspaceId}/roles": {
                body = await getRoles(userId, pathParams.workspaceId);
                break;
            }


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