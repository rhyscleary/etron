// Author(s): Rhys Cleary

const { getUserInvites } = require("./inviteService");

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
            // VIEW INVITES FOR USER EMAIL
            case "GET /user/{email}/invites": {
                if (!pathParams.email) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.email !== "string") {
                    throw new Error("email must be a string");
                }

                body = await getUserInvites(pathParams.email);
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