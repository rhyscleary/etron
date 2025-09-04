// Author(s): Rhys Cleary

const { updateDraftReport, createDraftReport, getDraftReport, getDraftReports, deleteDraftReport } = require("./draftService");

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

            // CREATE DRAFT
            case "POST /reports/drafts": {
                if (!requestJSON.workspaceId) {
                    throw new Error("Please specify a workspaceId");
                }
                body = await createDraftReport(authUserId, requestJSON);
                break;
            }

            // UPDATE DRAFT
            case "PUT /reports/drafts/{draftId}": {
                if (!requestJSON.workspaceId) {
                    throw new Error("Please specify a workspaceId");
                }
                if (!pathParams.draftId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.draftId !== "string") {
                    throw new Error("draftId must be a UUID, 'string'");
                }
                body = await updateDraftReport(authUserId, pathParams.draftId, requestJSON);
                break;
            }

            // GET DRAFT BY ID
            case "GET /reports/drafts/{draftId}": {
                const workspaceId = queryParams.workspaceId;

                if (!pathParams.draftId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.draftId !== "string") {
                    throw new Error("draftId must be a UUID, 'string'");
                }
                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getDraftReport(authUserId, workspaceId, pathParams.draftId);
                break;
            }

            // GET ALL DRAFTS IN WORKSPACE
            case "GET /reports/drafts": {
                const workspaceId = queryParams.workspaceId;

                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getDraftReports(authUserId, workspaceId);
                break;
            }

            // DELETE DRAFT
            case "DELETE /reports/drafts/{draftId}": {
                const workspaceId = queryParams.workspaceId;
                
                if (!pathParams.draftId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.draftId !== "string") {
                    throw new Error("draftId must be a UUID, 'string'");
                }
                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await deleteDraftReport(authUserId, workspaceId, pathParams.draftId);
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