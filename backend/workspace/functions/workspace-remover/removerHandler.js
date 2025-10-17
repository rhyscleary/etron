// Author(s): Rhys Cleary

const { deleteWorkspace } = require("./removerService");


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

            // DELETE WORKSPACE
            case "DELETE /workspace/{workspaceId}": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameter workspaceId");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await deleteWorkspace(authUserId, pathParams.workspaceId);
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