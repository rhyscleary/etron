// Author(s): Rhys Cleary

const { saveSchema, saveStoredData, replaceStoredData } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { generateSchema } = require("@etron/data-sources-shared/utils/generateSchema");
const { translateData } = require("@etron/data-sources-shared/utils/translateData");
const { toParquet } = require("@etron/data-sources-shared/utils/typeConversion");
const { validateFormat } = require("@etron/data-sources-shared/utils/validateFormat");
const dataSourceRepo = require("@etron/data-sources-shared/repositories/dataSourceRepository");


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

        // create the schema and save it to s3
        const schema = generateSchema(translatedData.slice(0, 100));
        await saveSchema(workspaceId, dataSourceId, schema);

        // convert to parquet
        const parquetBuffer = await toParquet(translatedData);

        // save data depending on method
        if (dataSource.method === "extend") {
            await saveStoredData(workspaceId, dataSourceId, parquetBuffer);
        } else {
            await replaceStoredData(workspaceId, dataSourceId, parquetBuffer);
        }

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