// Author(s): Rhys Cleary

const { inviteUsertoWorkspace, cancelUsersInvites, cancelInviteToWorkspace, getInvite, getSentInvites } = require("./inviteService");

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

            // INSTALL MODULE
            case "POST /workspace/{workspaceId}/modules/{moduleId}": {
                if (!pathParams.workspaceId || !pathParams.moduleId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.moduleId !== "string") {
                    throw new Error("moduleId must be a UUID, 'string'");
                }

                body = await inviteUsertoWorkspace(authUserId, pathParams.workspaceId, requestJSON);
                break;
            }

            // TOGGLE A MODULE IN THE WORKSPACE
            case "PUT /workspace/{workspaceId}/modules/{moduleId}/toggle": {
                if (!pathParams.workspaceId || !pathParams.moduleId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.moduleId !== "string") {
                    throw new Error("moduleId must be a UUID, 'string'");
                }

                body = await cancelUsersInvites(pathParams.email);
                break;
            }

            // UNINSTALL A MODULE IN THE WORKSPACE
            case "DELETE /workspace/{workspaceId}/modules/{moduleId}": {
                if (!pathParams.workspaceId || !pathParams.moduleId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.moduleId !== "string") {
                    throw new Error("moduleId must be a UUID, 'string'");
                }

                body = await cancelInviteToWorkspace(authUserId, pathParams.workspaceId, pathParams.inviteId);
                break;
            }

            // GET INSTALLED MODULES
            case "GET /workspace/{workspaceId}/modules": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getInvite(pathParams.workspaceId, pathParams.inviteId);
                break;
            }

            // GET ALL AVAILABLE MODULES
            case "GET /workspace/modules": {
                body = await getSentInvites(authUserId);
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