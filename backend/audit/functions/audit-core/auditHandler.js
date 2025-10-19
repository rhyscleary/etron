// Author(s): Rhys Cleary

const { getWorkspaceLog, getUserLog, getWorkspaceLogDownloadUrl, getUserLogDownloadUrl } = require("./auditService");

exports.handler = async (event) => {
    let statusCode = 200;
    let body;
    
    try {
        const requestJSON = event.body ? JSON.parse(event.body) : {};
        const pathParams = event.pathParameters || {};
        const queryParams = event.queryStringParameters || {};
        const authUserId = event.requestContext.authorizer.claims.sub;

        if (!authUserId) {
            throw new Error("User not authenticated");
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {

            // GET AUDIT LOG
            case "GET /audits": {
                const { workspaceId, userId, limit, lastKey } = queryParams;

                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                if (userId) {
                    body = await getUserLog(authUserId, workspaceId, userId, limit, lastKey);
                } else {
                    body = await getWorkspaceLog(authUserId, workspaceId, limit, lastKey);
                }
                break;
            }

            // DOWNLOAD AUDIT LOG FOR WORKSPACE
            case "GET /audits/download/workspace": {
                const { workspaceId } = queryParams;

                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getWorkspaceLogDownloadUrl(authUserId, workspaceId);
                break;
            }

            // DOWNLOAD AUDIT LOG FOR USER
            case "GET /audits/download/user": {
                const { workspaceId, userId } = queryParams;

                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getUserLogDownloadUrl(authUserId, workspaceId, userId);
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