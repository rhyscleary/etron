// Author(s): Rhys Cleary

const { createProfileInWorkspace, updateProfileInWorkspace, deleteProfileInWorkspace, getProfileInWorkspace, getProfilesInWorkspace } = require("./profileService");

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
        
            // CREATE PROFILE
            case "POST /workspace/{workspaceId}/profiles": {
                if (!workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await createProfileInWorkspace(authUserId, pathParams.workspaceId, requestJSON);
                break;
            }

            // UPDATE PROFILE
            case "PUT /workspace/{workspaceId}/profiles/{profileId}": {
                if (!workspaceId || !profileId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof profileId !== "string") {
                    throw new Error("profileId must be a UUID, 'string'");
                }

                body = await updateProfileInWorkspace(authUserId, pathParams.workspaceId, pathParams.profileId, requestJSON);
                break;
            }

            // DELETE PROFILE
            case "DELETE /workspace/{workspaceId}/profiles/{profileId}": {
                if (!workspaceId || !profileId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof profileId !== "string") {
                    throw new Error("profileId must be a UUID, 'string'");
                }

                body = await deleteProfileInWorkspace(authUserId, pathParams.workspaceId, pathParams.profileId);
                break;
            }

            // GET PROFILE IN WORKSPACE
            case "GET /workspace/{workspaceId}/profiles/{profileId}": {
                if (!workspaceId || !profileId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof profileId !== "string") {
                    throw new Error("profileId must be a UUID, 'string'");
                }

                body = await getProfileInWorkspace(authUserId, pathParams.workspaceId, pathParams.profileId);
                break;
            }

            // GET ALL PROFILES IN WORKSPACE
            case "GET /workspace/{workspaceId}/profiles": {
                if (!workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getProfilesInWorkspace(authUserId, pathParams.workspaceId);
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