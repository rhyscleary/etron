// Author(s): Rhys Cleary

const { addUserToWorkspace, updateUserInWorkspace, removeUserFromWorkspace, getUserInWorkspace, getUsersInWorkspace } = require("./userService");

exports.handler = async (event) => {
    let statusCode = 200;
    let body;
    
    try {
        const requestJSON = event.body ? JSON.parse(event.body) : {};
        const pathParams = event.pathParameters || {};
        const authUserId = event.requestContext.authorizer.claims.sub;

        if (!authUserId) {
            throw new Error("User not authenticated");
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
        
            // ADD USER TO WORKSPACE
            case "POST /workspace/{workspaceId}/users/invites/{inviteId}": {
                if (!pathParams.workspaceId || !pathParams.inviteId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.inviteId !== "string") {
                    throw new Error("inviteId must be a UUID, 'string'");
                }

                body = await addUserToWorkspace(pathParams.workspaceId, pathParams.inviteId);
                break;
            }

            // UPDATE USER IN WORKSPACE
            case "PUT /workspace/{workspaceId}/users/{userId}": {
                if (!pathParams.workspaceId || !pathParams.userId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.userId !== "string") {
                    throw new Error("userId must be a UUID, 'string'");
                }

                body = await updateUserInWorkspace(authUserId, pathParams.workspaceId, pathParams.userId, requestJSON);
                break;
            }

            // REMOVE USER FROM WORKSPACE
            case "DELETE /workspace/{workspaceId}/users/{userId}": {
                if (!pathParams.workspaceId || !pathParams.userId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.userId !== "string") {
                    throw new Error("userId must be a UUID, 'string'");
                }

                body = await removeUserFromWorkspace(authUserId, pathParams.workspaceId, pathParams.userId);
                break;
            }

            // GET USER IN WORKSPACE
            case "GET /workspace/{workspaceId}/users/{userId}": {
                if (!pathParams.workspaceId || !pathParams.userId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.userId !== "string") {
                    throw new Error("userId must be a UUID, 'string'");
                }

                body = await getUserInWorkspace(authUserId, pathParams.workspaceId, pathParams.userId);
                break;
            }

            // GET ALL USERS IN WORKSPACE
            case "GET /workspace/{workspaceId}/users": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameter");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getUsersInWorkspace(authUserId, pathParams.workspaceId);
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