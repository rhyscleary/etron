// Author(s): Rhys Cleary

const { deleteDataSourceInWorkspace, getDataSourcesInWorkspace, getDataSourceInWorkspace, updateDataSourceInWorkspace, testConnection, createLocalDataSource, createRemoteDataSource, getRemotePreview } = require("../services/dataSourceService");

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

        if (!workspaceId) {
            throw new Error("Missing workspaceId in query parameters");
        }

        if (typeof workspaceId !== "string") {
            throw new Error("workspaceId not a string");
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
            // ADD REMOTE DATA SOURCE
            case "POST /day-book/data-sources/remote": {
                body = await createRemoteDataSource(authUserId, workspaceId, requestJSON);
                break;
            }

            // ADD LOCAL DATA SOURCE
            case "POST /day-book/data-sources/local": {
                body = await createLocalDataSource(authUserId, workspaceId, requestJSON);
                break;
            }

            // TEST DATA SOURCE CONNECTION
            case "POST /day-book/data-sources/test-connection": {
                body = await testConnection(authUserId, requestJSON);
                break;
            }

            // PREVIEW REMOTE DATA SOURCE CONNECTION
            case "GET /day-book/data-sources/preview/remote": {
                body = await getRemotePreview(authUserId, requestJSON);
                break;
            }

            // UPDATE DATA SOURCES
            case "PUT /day-book/data-sources/{dataSourceId}": {
                if (!pathParams.dataSourceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.dataSourceId !== "string") {
                    throw new Error("dataSourceId must be a UUID, 'string'");
                }

                body = await updateDataSourceInWorkspace(authUserId, workspaceId, pathParams.dataSourceId, requestJSON);
                break;
            }

            // GET DATA SOURCE
            case "GET /day-book/data-sources/{dataSourceId}": {
                if (!pathParams.dataSourceId) {
                    throw new Error("Missing dataSourceId in path parameters");
                }

                if (typeof pathParams.dataSourceId !== "string") {
                    throw new Error("dataSourceId must be a UUID, 'string'");
                }

                body = await getDataSourceInWorkspace(authUserId, workspaceId, pathParams.dataSourceId);
                break;
            }

            // GET ALL DATA SOURCES
            case "GET /day-book/data-sources": {
                body = await getDataSourcesInWorkspace(authUserId, workspaceId);
                break;
            }

            // REMOVE DATA SOURCE
            case "DELETE /day-book/data-sources/{dataSourceId}": {
                if (!pathParams.dataSourceId) {
                    throw new Error("Missing required path parameters");
                }

                if (typeof pathParams.dataSourceId !== "string") {
                    throw new Error("dataSourceId must be a UUID, 'string'");
                }
                
                body = await deleteDataSourceInWorkspace(authUserId, workspaceId, pathParams.dataSourceId);
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