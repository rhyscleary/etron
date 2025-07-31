// Author(s): Rhys Cleary

const { deleteDataSourceInWorkspace, getDataSourcesInWorkspace, getDataSourceInWorkspace, updateDataSourceInWorkspace, createDataSourceInWorkspace } = require("../services/dataSourceService");

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
            // ADD DATA SOURCE
            case "POST /workspace/{workspaceId}/day-book/data-sources": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await createDataSourceInWorkspace(authUserId, pathParams.workspaceId, requestJSON);
                break;
            }

            // UPDATE DATA SOURCES
            case "PUT /workspace/{workspaceId}/day-book/data-sources/{dataSourceId}": {
                if (!pathParams.workspaceId || !pathParams.dataSourceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.dataSourceId !== "string") {
                    throw new Error("dataSourceId must be a UUID, 'string'");
                }

                body = await updateDataSourceInWorkspace(authUserId, pathParams.workspaceId, pathParams.dataSourceId, requestJSON);
                break;
            }

            // GET DATA SOURCE
            case "GET /workspace/{workspaceId}/day-book/data-sources/{dataSourceId}": {
                if (!pathParams.workspaceId || !pathParams.dataSourceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.dataSourceId !== "string") {
                    throw new Error("dataSourceId must be a UUID, 'string'");
                }

                body = await getDataSourceInWorkspace(authUserId, pathParams.workspaceId, pathParams.dataSourceId);
                break;
            }

            // GET ALL DATA SOURCES
            case "GET /workspace/{workspaceId}/day-book/data-sources": {
                if (!pathParams.workspaceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                body = await getDataSourcesInWorkspace(authUserId, pathParams.workspaceId);
                break;
            }

            // REMOVE DATA SOURCE
            case "DELETE /workspace/{workspaceId}/day-book/data-sources/{dataSourceId}": {
                if (!pathParams.workspaceId || !pathParams.dataSourceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.workspaceId !== "string") {
                    throw new Error("workspaceId must be a UUID, 'string'");
                }

                if (typeof pathParams.dataSourceId !== "string") {
                    throw new Error("dataSourceId must be a UUID, 'string'");
                }
                
                body = await deleteDataSourceInWorkspace(authUserId, pathParams.workspaceId, pathParams.dataSourceId);
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