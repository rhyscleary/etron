// Author(s): Rhys Cleary
const createWorkspace = require("./services/createWorkspace");
const deleteWorkspace = require("./services/deleteWorkspace");
const getWorkspaceById = require("./services/getWorkspaceById");
const updateWorkspace = require("./services/updateWorkspace");

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
            case "PUT /workspace/{id}": {
                body = await updateWorkspace(pathParams.id, requestJSON);
                break;
            }

            // GET WORKSPACE BY ID
            case "GET /workspace/{id}": {
                body = await getWorkspaceById(pathParams.id);
                break;
            }

            // DELETE WORKSPACE
            case "DELETE /workspace/{id}": {
                body = await deleteWorkspace(userId, pathParams.id);
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