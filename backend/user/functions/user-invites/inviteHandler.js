// Author(s): Rhys Cleary

const { getUserInvites } = require("./inviteService");

exports.handler = async (event) => {
    let statusCode = 200;
    let body;
    
    try {
        const requestJSON = event.body ? JSON.parse(event.body) : {};
        const pathParams = event.pathParameters || {};
        const queryParams = event.queryStringParameters || {};
        const userId = event.requestContext.authorizer.claims.sub;
        const authUserEmail = event.requestContext.authorizer.claims.email;

        if (!userId) {
            throw new Error("User not authenticated");
        }

        if (!authUserEmail) {
            throw new Error("Authenticated user email not found");
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
            // VIEW INVITES FOR USER EMAIL
            case "GET /user/invites": {
                const targetEmail = queryParams.email;
                if (!targetEmail || typeof targetEmail !== "string") {
                    throw new Error("Missing or invalid email query parameters");
                }
                
                // ensure only the user can fetch their invites
                if (authUserEmail !== targetEmail) {
                    throw new Error("Not authorized to view another user's invites");
                }

                body = await getUserInvites(targetEmail);
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