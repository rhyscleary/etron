// Author(s): Rhys Cleary

const { toggleModule, uninstallModule, installModule, getInstalledModules, getAvailableModules } = require("./moduleService");

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
            case "POST /workspace/{workspaceId}/modules/{moduleKey}": {
                if (!pathParams.workspaceId || !pathParams.moduleKey) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.moduleKey !== "string") {
                    throw new Error("moduleKey must be a UUID, 'string'");
                }

                body = await installModule(authUserId, pathParams.workspaceId, pathParams.moduleKey);
                break;
            }

            // TOGGLE A MODULE IN THE WORKSPACE
            case "PUT /workspace/{workspaceId}/modules/{moduleKey}/toggle": {
                if (!pathParams.workspaceId || !pathParams.moduleKey) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.moduleKey !== "string") {
                    throw new Error("moduleKey must be a UUID, 'string'");
                }

                body = await toggleModule(authUserId, pathParams.workspaceId, pathParams.moduleKey);
                break;
            }

            // UNINSTALL A MODULE IN THE WORKSPACE
            case "DELETE /workspace/{workspaceId}/modules/{moduleKey}": {
                if (!pathParams.workspaceId || !pathParams.moduleKey) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.moduleKey !== "string") {
                    throw new Error("moduleKey must be a UUID, 'string'");
                }

                body = await uninstallModule(authUserId, pathParams.workspaceId, pathParams.moduleKey);
                break;
            }

            // GET INSTALLED MODULES
            case "GET /workspace/{workspaceId}/modules/installed": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getInstalledModules(authUserId, pathParams.workspaceId);
                break;
            }

            // GET ALL AVAILABLE MODULES
            case "GET /workspace/{workspaceId}/modules/uninstalled": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getAvailableModules(authUserId, pathParams.workspaceId);
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