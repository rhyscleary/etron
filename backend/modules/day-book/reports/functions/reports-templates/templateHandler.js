// Author(s): Rhys Cleary

const { createTemplateReport, updateTemplateReport, getTemplateReport, getTemplateReports, deleteTemplateReport } = require("./templateService");

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

            // CREATE TEMPLATE
            case "POST /reports/templates": {
                if (!requestJSON.workspaceId) {
                    throw new Error("Please specify a workspaceId");
                }
                body = await createTemplateReport(authUserId, requestJSON);
                break;
            }

            // UPDATE TEMPLATE
            case "PATCH /reports/templates/{templateId}": {
                if (!requestJSON.workspaceId) {
                    throw new Error("Please specify a workspaceId");
                }
                if (!pathParams.templateId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.templateId !== "string") {
                    throw new Error("templateId must be a UUID, 'string'");
                }
                body = await updateTemplateReport(authUserId, pathParams.templateId, requestJSON);
                break;
            }

            // GET TEMPLATE BY ID
            case "GET /reports/templates/{templateId}": {
                const workspaceId = queryParams.workspaceId;

                if (!pathParams.templateId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.templateId !== "string") {
                    throw new Error("templateId must be a UUID, 'string'");
                }
                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getTemplateReport(authUserId, workspaceId, pathParams.templateId);
                break;
            }

            // GET ALL TEMPLATES IN WORKSPACE
            case "GET /reports/templates": {
                const workspaceId = queryParams.workspaceId;

                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await getTemplateReports(authUserId, workspaceId);
                break;
            }

            // DELETE TEMPLATE
            case "DELETE /reports/templates/{templateId}": {
                const workspaceId = queryParams.workspaceId;
                
                if (!pathParams.templateId) {
                    throw new Error("Missing required path parameters");
                }
                if (typeof pathParams.templateId !== "string") {
                    throw new Error("templateId must be a UUID, 'string'");
                }
                if (!workspaceId || typeof workspaceId !== "string") {
                    throw new Error("Missing required query parameters");
                }

                body = await deleteTemplateReport(authUserId, workspaceId, pathParams.templateId);
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