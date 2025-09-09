// Author(s): Rhys Cleary

const dataSourceRepo = require("@etron/data-sources-shared/repositories/dataSourceRepository");
const dataSourceSecretsRepo = require("@etron/data-sources-shared/repositories/dataSourceSecretsRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const adapterFactory = require("@etron/data-sources-shared/adapters/adapterFactory");
const { saveStoredData } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { validateFormat } = require("@etron/data-sources-shared/utils/validateFormat");
const { translateData } = require("@etron/data-sources-shared/utils/translateData");
const { toParquet } = require("@etron/data-sources-shared/utils/typeConversion");
const { generateSchema } = require("@etron/data-sources-shared/utils/schema");
const { saveSchemaAndUpdateTable } = require("@etron/data-sources-shared/utils/schema");

async function fetchData() {
    const workspaces = await workspaceRepo.getAllWorkspaces();
    const allowedTypes = adapterFactory.getAllowedPollingTypes();

    for (const workspace of workspaces) {
        const dataSources = await dataSourceRepo.getDataSourcesByWorkspaceId(workspace.workspaceId);

        for (const dataSource of dataSources) {

            // check if the data source is active and an allowed type
            if (!allowedTypes.includes(dataSource.sourceType)) {
                continue;
            }
            if (dataSource.status !== "active" && dataSource.status !== "error") {
                continue;
            }

            // get sources secrets
            const secrets = await dataSourceSecretsRepo.getSecrets(workspace.workspaceId, dataSource.dataSourceId);

            // create adapter
            const adapter = adapterFactory.getAdapter(dataSource.sourceType);

            // try polling
            try {
                const newData = await poll(adapter, dataSource.config, secrets);
                const translatedData = translateData(newData);

                if (translatedData.length === 0) {
                    console.warn(`No data returned for ${dataSource.dataSourceId}`);
                    await dataSourceRepo.updateDataSourceStatus(
                        workspace.workspaceId, 
                        dataSource.dataSourceId, 
                        { status: "no_data", errorMessage: "No data existent" }
                    );
                    continue;
                }

                const {valid, error } = validateFormat(translatedData);
                if (!valid) throw new Error(`Invalid data format: ${error}`);

                // create the schema and save it to s3
                const schema = generateSchema(translatedData.slice(0, 100));
                await saveSchemaAndUpdateTable(workspace.workspaceId, dataSource.dataSourceId, schema);

                // convert the data to parquet file
                const parquetBuffer = await toParquet(translatedData);

                if (dataSource.method === "extend") {
                    // extend the data source
                    await saveStoredData(workspace.workspaceId, dataSource.dataSourceId, parquetBuffer);

                } else {
                    // replace data
                    await replaceStoredData(workspace.workspaceId, dataSource.dataSourceId, parquetBuffer);
                }

                // update status
                if (dataSource.status !== "active" || dataSource.error !== null) {
                    await dataSourceRepo.updateDataSourceStatus(workspace.workspaceId, dataSource.dataSourceId, {
                        status: "active",
                        errorMessage: null
                    });
                }

            } catch (error) {
                // if the data source fails three polls update it's status to error
                const errorItem = {
                    status: "error",
                    errorMessage: error.message
                }

                await dataSourceRepo.updateDataSourceStatus(workspace.workspaceId, dataSource.dataSourceId, errorItem);
            }
        }
    }
}

async function poll(adapter, config, secrets) {
    let currentError;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            return await adapter.poll(config, secrets);
        } catch (error) {
           currentError = error;  
        }
    }

    throw currentError;
}

module.exports = {
    fetchData
};