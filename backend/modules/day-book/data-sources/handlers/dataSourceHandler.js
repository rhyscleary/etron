// Author(s): Rhys Cleary

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
            case "POST /day-book/data-sources": {
                body = await addDataSource(authUserId, requestJSON);
                break;
            }

            // UPDATE DATA SOURCES
            case "PUT /day-book/data-sources/{dataSourceId}": {
                body = await updateDataSource(authUserId, pathParams.dataSourceId, requestJSON);
                break;
            }

            // GET DATA SOURCE
            case "GET /day-book/data-sources/{dataSourceId}": {
                body = await getDataSourceById(authUserId, pathParams.dataSourceId);
                break;
            }

            // GET ALL DATA SOURCES
            case "GET /day-book/data-sources": {
                body = await getDataSources(authUserId);
                break;
            }

            // REMOVE DATA SOURCE
            case "DELETE /day-book/data-sources/{dataSourceId}": {
                body = await removeDataSource(authUserId, pathParams.dataSourceId);
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