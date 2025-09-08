// Author(s): Rhys Cleary
const {
    AthenaClient,
    StartQueryExecutionCommand,
    GetQueryExecutionCommand,
    GetQueryResultsCommand,
} = require("@aws-sdk/client-athena");
const { saveSchema } = require("../repositories/dataBucketRepository");

const client = new AthenaClient({});

function handleQueryError(error, message) {
    console.error(`${message}:`, error);
    throw new Error(message);
}

async function startQuery(query, database, outputLocation) {
    try {
        const response = await client.send(
            new StartQueryExecutionCommand({
                QueryString: query,
                QueryExecutionContext: { Database: database },
                ResultConfiguration: { OutputLocation: outputLocation }
            }),
        );

        const queryExecutionId = response.QueryExecutionId;

        // poll until the qery completes
        let queryState = "RUNNING";
        while (queryState === "RUNNING" || queryState === "QUEUED") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const statusResponse = await client.send(
                new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId })
            );
            queryState = statusResponse.QueryExecution.Status.State;

            if (queryState === "FAILED") {
                throw new Error(
                    `Athena query failed: ${statusResponse.QueryExecution.Status.StateChangeReason}`
                );
            }

            if (queryState === "CANCELLED") {
                throw new Error("Athena query was cancelled");
            }
        }

        return queryExecutionId;
    } catch (error) {
        handleQueryError(error, `Error querying the database, ${database}`);
    }
}

async function getQueryResults(queryExecutionId, nextToken, maxResults = 50) {
    return await client.send(
        new GetQueryResultsCommand({
            QueryExecutionId: queryExecutionId,
            NextToken: nextToken,
            MaxResults: maxResults,
        })
    );
}

function parseResults(results) {
    const columns = results.ResultSetMetadata.ColumnInfo.map((column) => column.Name);
    const rows = results.Rows;
    const dataRows = rows.slice(1);

    return dataRows.map((row) => {
        const object = {};
        row.Data.forEach((field, i) => {
            object[columns[i]] = field.VarCharValue ?? null;
        });
        return object;
    });
}

async function createAthenaTable(workspaceId, dataSourceId, schema, tableName, dataLocation, database, outputLocation) {

    const columns = saveSchema.map(column => `${column.name} ${column.type}`).join(",\n    ");

    const ddl = `
        CREATE EXTERNAL TABLE ${tableName} (
            ${columns}
        )
        STORED AS PARQUET
        LOCATION '${dataLocation}'
    `;

    console.log(`Creating athena table ${tableName}`);
    await runQuery(ddl, database, outputLocation);

    return tableName;
}

async function runQuery(query, database, outputLocation, options = {}) {
    const { pageSize = 50, nextToken } = options;

    let queryExecutionId = options.queryExecutionId;
    if (!queryExecutionId) {
        queryExecutionId = await startQuery(query, database, outputLocation);
    }

    // fetch the results
    const results = await getQueryResults(queryExecutionId, nextToken, pageSize);
    const parsed = parseResults(results);

    return {
        data: parsed,
        queryExecutionId,
        nextToken: results.NextToken
    };
}

module.exports = {
    runQuery,
    createAthenaTable
}