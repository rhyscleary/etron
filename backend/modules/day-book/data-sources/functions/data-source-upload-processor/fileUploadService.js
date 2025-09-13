// Author(s): Rhys Cleary

const { saveStoredData, replaceStoredData } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { generateSchema } = require("@etron/data-sources-shared/utils/schema");
const { translateData } = require("@etron/data-sources-shared/utils/translateData");
const { toParquet } = require("@etron/data-sources-shared/utils/typeConversion");
const { validateFormat } = require("@etron/data-sources-shared/utils/validateFormat");
const dataSourceRepo = require("@etron/day-book-shared/repositories/dataSourceRepository");
const { saveSchemaAndUpdateTable } = require("@etron/data-sources-shared/utils/schema");
const { appendToStoredData } = require("../../data-sources-shared/repositories/dataBucketRepository");


async function processUploadedFile(workspaceId, dataSourceId, rawData) {
    // get the dataSource
    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);
    if (!dataSource) {
        throw new Error(`Data source not found: ${dataSourceId}`);
    }

    try {
        const translatedData = translateData(rawData);

        if (translatedData.length === 0) {
            console.warn(`Empty file for ${dataSource.dataSourceId}`);
            await dataSourceRepo.updateDataSourceStatus(
                workspaceId, 
                dataSourceId, 
                { status: "no_data", errorMessage: "No data existent" }
            );
            return { success: false };
        }

        const {valid, error } = validateFormat(translatedData);
        if (!valid) throw new Error(`Invalid data format: ${error}`);

        // create the schema 
        const schema = generateSchema(translatedData.slice(0, 100));

        // convert to parquet
        const parquetBuffer = await toParquet(translatedData, schema);

        // save data depending on method
        if (dataSource.method === "extend") {
            await appendToStoredData(workspaceId, dataSourceId, translatedData, schema);
        } else {
            await replaceStoredData(workspaceId, dataSourceId, parquetBuffer);
        }

        // save the schema to S3
        await saveSchemaAndUpdateTable(workspaceId, dataSourceId, schema);

        // update status
        await dataSourceRepo.updateDataSourceStatus(workspaceId, dataSourceId, {
            status: "active",
            errorMessage: null
        });

        return { success: true };

    } catch (error) {
        // update status to error
        await dataSourceRepo.updateDataSourceStatus(workspaceId, dataSourceId, {
            status: "error",
            errorMessage: error.message
        });
        throw error;
    }
    
}

module.exports = {
    processUploadedFile
};