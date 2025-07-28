// Author(s): Rhys Cleary

const { getWorkspaceByUserId, transferWorkspaceOwnership, getDefaultWorkspacePermissions, createWorkspace, updateWorkspace, getWorkspaceByWorkspaceId, deleteWorkspace } = require("./workspaceService");


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

            // CREATE WORKSPACE
            case "POST /workspace": {
                body = await createWorkspace(authUserId, requestJSON);
                break;
            }

            // UPDATE WORKSPACE
            case "PUT /workspace/{workspaceId}": {
                body = await updateWorkspace(authUserId, pathParams.workspaceId, requestJSON);
                break;
            }

            // GET WORKSPACE BY ID
            case "GET /workspace/{workspaceId}": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getWorkspaceByWorkspaceId(pathParams.workspaceId);
                break;
            }

            // GET WORKSPACE BY USERID
            case "GET /workspace/users/{userId}": {
                if (!pathParams.userId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.userId !== "string") {
                    throw new Error("userId must be a UUID, 'string'");
                }

                body = await getWorkspaceByUserId(pathParams.userId);
                break;
            }

            // TRANSFER OWNERSHIP
            case "PUT /workspace/{workspaceId}/transfer/{userId}": {
                if (!pathParams.workspaceId || !pathParams.userId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.userId !== "string") {
                    throw new Error("userId must be a UUID, 'string'");
                }

                body = await transferWorkspaceOwnership(authUserId, workspaceId, userId);
                break;
            }

            // DELETE WORKSPACE
            case "DELETE /workspace/{workspaceId}": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await deleteWorkspace(authUserId, pathParams.workspaceId);
                break;
            }

            // GET DEFAULT WORKSPACE PERMISSIONS
            case "GET /workspace/permissions": {
                body = await getDefaultWorkspacePermissions();
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