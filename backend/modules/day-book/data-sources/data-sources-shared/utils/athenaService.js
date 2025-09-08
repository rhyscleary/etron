// Author(s): Rhys Cleary
const {
    AthenaClient,
    StartQueryExecutionCommand,
    GetQueryExecutionCommand,
    GetQueryResultsCommand,
} = require("@aws-sdk/client-athena");
const { saveSchema } = require("../repositories/dataBucketRepository")

const client = new AthenaClient({});

async function startQuery(query, database, outputLocation) {
    try {
        const reponse = await client.send(
            new StartQueryExecutionCommand({
                QueryString: query,
                QueryExecutionContext: { Database: database },
                ResultConfiguration: { OutputLocation: outputLocation }
            }),
        );

        return reponse.QueryExecutionId;
    } catch (error) {

    }
}

async function runQuery(query, database, outputLocation, workspaceId, options = {}) {
    const { pageSize = 50, nextToken } = options;

    let queryExecutionId = options.queryExecutionId;
    if (!queryExecutionId) {
        queryExecutionId = await startQuery(query, database, outputLocation);
    }
}

module.exports = {
    runQuery,
}