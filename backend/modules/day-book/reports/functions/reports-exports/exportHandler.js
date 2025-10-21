// Author(s): Rhys Cleary

const { addExportedReport, getExportedReport, getExportedReports, getExportDownloadUrl } = require("./exportService");

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

            // ADD EXPORT
            case "POST /day-book/reports/exports": {
                if (!requestJSON.workspaceId) {
                    throw new Error("Please specify a workspaceId");
                }
                body = await addExportedReport(authUserId, requestJSON);
                break;
            }

            // GET EXPORT BY ID
            case "GET /day-book/reports/exports/{exportId}": {
                const workspaceId = queryParams.workspaceId;

                if (!pathParams.exportId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.exportId !== "string") {
                    throw new Error("exportId must be a UUID, 'string'");
                }
                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getExportedReport(authUserId, workspaceId, pathParams.exportId);
                break;
            }

            // GET ALL EXPORTS IN WORKSPACE
            case "GET /day-book/reports/exports": {
                const workspaceId = queryParams.workspaceId;

                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getExportedReports(authUserId, workspaceId);
                break;
            }

            // GET EXPORT DOWNLOAD URL
            case "GET /day-book/reports/exports/{exportId}/download": {
                const workspaceId = queryParams.workspaceId;

                if (!pathParams.exportId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.exportId !== "string") {
                    throw new Error("exportId must be a UUID, 'string'");
                }
                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getExportDownloadUrl(authUserId, workspaceId, pathParams.exportId);
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