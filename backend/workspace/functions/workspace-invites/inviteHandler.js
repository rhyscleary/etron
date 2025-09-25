// Author(s): Rhys Cleary

const { inviteUsertoWorkspace, cancelUsersInvites, cancelInviteToWorkspace, getInvite, getSentInvites } = require("./inviteService");

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

            // INVITE USER
            case "POST /workspace/{workspaceId}/invites": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await inviteUsertoWorkspace(authUserId, pathParams.workspaceId, requestJSON);
                break;
            }

            // CANCEL ALL WORKSPACE INVITES FOR A USER VIA EMAIL
            case "DELETE /workspace/invites": {
                const email = queryParams.email;

                if (!email || typeof email !== "string") {
                    throw new Error("Missing required query parameter email");
                }                

                body = await cancelUsersInvites(email);
                break;
            }

            // CANCEL INVITE TO A WORKSPACE
            case "DELETE /workspace/{workspaceId}/invites/{inviteId}": {
                if (!pathParams.workspaceId || !pathParams.inviteId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.inviteId !== "string") {
                    throw new Error("inviteId must be a UUID, 'string'");
                }

                body = await cancelInviteToWorkspace(authUserId, pathParams.workspaceId, pathParams.inviteId);
                break;
            }

            // GET INVITE
            case "GET /workspace/{workspaceId}/invites/{inviteId}": {
                if (!pathParams.workspaceId || !pathParams.inviteId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.inviteId !== "string") {
                    throw new Error("inviteId must be a UUID, 'string'");
                }

                body = await getInvite(pathParams.workspaceId, pathParams.inviteId);
                break;
            }

            // GET ALL SENT INVITES IN A WORKSPACE
            case "GET /workspace/{workspaceId}/invites": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getSentInvites(authUserId, pathParams.workspaceId);
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