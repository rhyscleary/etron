const { removeAllDataSources, getDataSourcesByWorkspaceId } = require("../repositories/dataSourceRepository");
const { removeAllMetrics } = require("../repositories/metricRepository");
const { GlueClient, GetTablesCommand } = require("@aws-sdk/client-glue");
const { 
    AthenaClient, 
    StartQueryExecutionCommand, 
    GetQueryExecutionCommand 
} = require("@aws-sdk/client-athena");
const { removeAllReports } = require("../repositories/reportRepository");

const athena = new AthenaClient({});
const glue = new GlueClient({});

async function cleanupModule(workspaceId) {
    console.log(`DayBook cleaning up data for workspace ${workspaceId}`);

    const databaseName = process.env.ATHENA_DATABASE;

    await removeAllAthenaTables(workspaceId, databaseName);

    await removeAllDataSources(workspaceId);
    await removeAllMetrics(workspaceId);
    await removeAllReports(workspaceId);
}

async function removeAllAthenaTables(workspaceId, databaseName) {
    // get the data sources
    const dataSources = await getDataSourcesByWorkspaceId(workspaceId);
    if (!dataSources || dataSources.length === 0) return;

    const expectedTableNames = new Set(dataSources.map(ds => `ds_${ds.dataSourceId}`));

    const tableResponse = await glue.send(new GetTablesCommand({ DatabaseName: databaseName }));
    const tables = tableResponse.TableList || [];

    const matchingTables = tables.filter(table => expectedTableNames.has(table.Name));

    if (matchingTables.length === 0) return;

    const outputLocation = `s3://${process.env.WORKSPACE_BUCKET}/workspaces/${workspaceId}/day-book/athenaResults/`;

    // drop all tables
    await Promise.allSettled(
        matchingTables.map(async (table) => {
            const query = `DROP TABLE IF EXISTS ${table.Name}`;
            const params = {
                QueryString: query,
                QueryExecutionContext: { Database: databaseName },
                ResultConfiguration: { OutputLocation: outputLocation },
            };

            try {
                const startCommand = new StartQueryExecutionCommand(params);
                const { QueryExecutionId } = await athena.send(startCommand);

                // wait for the query to complete
                await waitForQueryCompletion(QueryExecutionId);
            } catch (error) {
                console.error(`Unable to drop table ${table.Name}`);
            }
        })
    );
}

async function waitForQueryCompletion(queryExecutionId) {
    while (true) {
        const { QueryExecution } = await athena.send(
            new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId })
        );
        const state = QueryExecution.Status.State;

        if (state === "SUCCEEDED") return;
        if (["FAILED", "CANCELLED"].includes(state)) {
            throw new Error(`Athena query ${queryExecutionId} failed: ${state}`);
        }

        await new Promise((res) => setTimeout(res, 2000));
    }
}

module.exports = { cleanupModule };
