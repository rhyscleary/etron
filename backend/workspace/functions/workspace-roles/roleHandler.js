// Author(s): Rhys Cleary

const { createRoleInWorkspace, updateRoleInWorkspace, deleteRoleInWorkspace, getRoleInWorkspace, getRolesInWorkspace } = require("./roleService");


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
        
            // CREATE ROLE
            case "POST /workspace/{workspaceId}/roles": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await createRoleInWorkspace(authUserId, pathParams.workspaceId, requestJSON);
                break;
            }

            // UPDATE ROLE
            case "PUT /workspace/{workspaceId}/roles/{roleId}": {
                if (!pathParams.workspaceId || !pathParams.roleId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.roleId !== "string") {
                    throw new Error("roleId must be a UUID, 'string'");
                }

                body = await updateRoleInWorkspace(authUserId, pathParams.workspaceId, pathParams.roleId, requestJSON);
                break;
            }

            // DELETE ROLE
            case "DELETE /workspace/{workspaceId}/roles/{roleId}": {
                if (!pathParams.workspaceId || !pathParams.roleId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.roleId !== "string") {
                    throw new Error("roleId must be a UUID, 'string'");
                }

                body = await deleteRoleInWorkspace(authUserId, pathParams.workspaceId, pathParams.roleId);
                break;
            }

            // GET ROLE IN WORKSPACE
            case "GET /workspace/{workspaceId}/roles/{roleId}": {
                if (!pathParams.workspaceId || !pathParams.roleId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.roleId !== "string") {
                    throw new Error("roleId must be a UUID, 'string'");
                }

                body = await getRoleInWorkspace(authUserId, pathParams.workspaceId, pathParams.roleId);
                break;
            }

            // GET ALL ROLES IN WORKSPACE
            case "GET /workspace/{workspaceId}/roles": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getRolesInWorkspace(authUserId, pathParams.workspaceId);
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