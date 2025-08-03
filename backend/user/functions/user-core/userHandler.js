// Author(s): Rhys Cleary

const { updateUserInUserPool } = require("./userService");

exports.handler = async (event) => {
    let statusCode = 200;
    let body;
    
    try {
        const requestJSON = event.body ? JSON.parse(event.body) : {};
        const pathParams = event.pathParameters || {};
        const authUserId = event.requestContext.authorizer.claims.sub;

        if (!userId) {
            throw new Error("User not authenticated");
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
            // UPDATE USER IN THE USER POOL
            case "PUT /user/{userId}/workspace/{workspaceId}": {
                if (!pathParams.userId || !pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.userId !== "string") {
                    throw new Error("userId must be a UUID, 'string'");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await updateUserInUserPool(pathParams.userId, pathParams.workspaceId, requestJSON);
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