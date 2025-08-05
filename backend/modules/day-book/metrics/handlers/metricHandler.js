// Author(s): Rhys Cleary

const { createMetricInWorkspace, updateMetricInWorkspace, getMetricInWorkspace, getMetricsInWorkspace, deleteMetricInWorkspace } = require("../services/metricService");

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

        const workspaceId = queryParams.workspaceId;

        if (!workspaceId || typeof workspaceId !== "string") {
            throw new Error("Missing required query parameters");
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
            // ADD METRIC
            case "POST /day-book/metrics": {
                body = await createMetricInWorkspace(authUserId, workspaceId, requestJSON);
                break;
            }

            // UPDATE METRIC
            case "PUT /day-book/metrics/{metricId}": {
                if (!pathParams.metricId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.metricId !== "string") {
                    throw new Error("metricId must be a UUID, 'string'");
                }

                body = await updateMetricInWorkspace(authUserId, workspaceId, pathParams.metricId, requestJSON);
                break;
            }

            // GET METRIC
            case "GET /day-book/metrics/{metricId}": {
                if (!pathParams.metricId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.metricId !== "string") {
                    throw new Error("metricId must be a UUID, 'string'");
                }

                body = await getMetricInWorkspace(authUserId, workspaceId, pathParams.metricId);
                break;
            }

            // GET ALL METRICS
            case "GET /day-book/metrics": {
                body = await getMetricsInWorkspace(authUserId, workspaceId);
                break;
            }

            // REMOVE METRIC
            case "DELETE /day-book/metrics/{metricId}": {
                if (!pathParams.metricId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.metricId !== "string") {
                    throw new Error("metricId must be a UUID, 'string'");
                }
                
                body = await deleteMetricInWorkspace(authUserId, workspaceId, pathParams.metricId);
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