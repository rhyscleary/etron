// Author(s): Rhys Cleary

const dataSourceRepo = require("@etron/day-book-shared/repositories/dataSourceRepository");
const dataSourceSecretsRepo = require("@etron/data-sources-shared/repositories/dataSourceSecretsRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const adapterFactory = require("@etron/data-sources-shared/adapters/adapterFactory");
const { saveStoredData } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { validateFormat } = require("@etron/data-sources-shared/utils/validateFormat");
const { translateData } = require("@etron/data-sources-shared/utils/translateData");
const { toParquet } = require("@etron/data-sources-shared/utils/typeConversion");
const { generateSchema } = require("@etron/data-sources-shared/utils/schema");
const { saveSchemaAndUpdateTable } = require("@etron/data-sources-shared/utils/schema");
const { appendToStoredData, replaceStoredData } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { castDataToSchema } = require("@etron/data-sources-shared/utils/castDataToSchema");

async function pollDataSource(workspace, dataSource) {
    const allowedTypes = adapterFactory.getAllowedPollingTypes();

    // check if the data source is active and an allowed type
    if (!allowedTypes.includes(dataSource.sourceType)) {
        return;
    }
    if (dataSource.status !== "active" && dataSource.status !== "error") {
        return;
    }

    // get sources secrets
    const secrets = await dataSourceSecretsRepo.getSecrets(workspace.workspaceId, dataSource.dataSourceId);

    // create adapter
    const adapter = adapterFactory.getAdapter(dataSource.sourceType);

    // try polling
    const newData = await retryPoll(adapter, dataSource.config, secrets);
    const translatedData = translateData(newData);

    if (translatedData.length === 0) {
        await dataSourceRepo.updateDataSourceStatus(
            workspace.workspaceId, 
            dataSource.dataSourceId, 
            { status: "no_data", errorMessage: "No data existent" }
        );
        return;
    }

    const {valid, error } = validateFormat(translatedData);
    if (!valid) throw new Error(`Invalid data format: ${error}`);

    // create the schema
    const schema = generateSchema(translatedData.slice(0, 100));

    // cast rows to the schema
    const castedData = castDataToSchema(translatedData, schema);

    // convert the data to parquet file
    const parquetBuffer = await toParquet(castedData, schema);

    if (dataSource.method === "extend") {
        // extend the data source
        await appendToStoredData(workspace.workspaceId, dataSource.dataSourceId, castedData, schema);
    } else {
        // replace data
        await replaceStoredData(workspace.workspaceId, dataSource.dataSourceId, parquetBuffer);
    }

    // save the schema to S3
    await saveSchemaAndUpdateTable(workspace.workspaceId, dataSource.dataSourceId, schema);

    // update status
    if (dataSource.status !== "active" || dataSource.error !== null) {
        await dataSourceRepo.updateDataSourceStatus(workspace.workspaceId, dataSource.dataSourceId, {
            status: "active",
            errorMessage: null
        });
    }
}

async function retryPoll(adapter, config, secrets) {
    let error;

    for (let i = 0; i < 3; i++) {
        try {
            return await adapter.poll(config, secrets);
        } catch (err) {
           error = err;  
        }
    }

    throw error;
}

module.exports = {
    pollDataSource
};