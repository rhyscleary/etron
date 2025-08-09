// Author(s): Rhys Cleary
const getWorkspaceModules = require("./services/getWorkspaceModules");
const addModuleToWorkspace = require("./services/addModuleToWorkspace");
const removeWorkspaceModule = require("./services/removeWorkspaceModule");
const getAvailableModules = require("./services/getAvailableModules");

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
            // GET ALL AVAILABLE MODULES
            case "GET /modules": {
                body = await getAvailableModules(); 
                break;
            }

            // ADD MODULE TO WORKSPACE (INSTALL)
            case "PUT /workspace/{workspaceId}/modules/{moduleId}": { 
                body = await addModuleToWorkspace(pathParams.workspaceId, pathParams.moduleId);
                break;
            }
            
            // REMOVE MODULE FROM WORKSPACE (UNINSTALL)
            case "DELETE /workspace/{workspaceId}/modules/{moduleId}": {
                body = await removeWorkspaceModule(pathParams.workspaceId, pathParams.moduleId);
            }


            // GET MODULES INSTALLED IN WORKSPACE
            case "GET /workspace/{workspaceId}/modules": {
                body = await getWorkspaceModules(pathParams.workspaceId);
                break;
            }

            // ENABLE MODULE IN WORKSPACE
            // DISABLE MODULE IN WORKSPACE
            
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