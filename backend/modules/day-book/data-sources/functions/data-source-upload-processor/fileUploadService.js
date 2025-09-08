// Author(s): Rhys Cleary

const { saveSchema } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { generateSchema } = require("@etron/data-sources-shared/utils/generateSchema");
const { translateData } = require("@etron/data-sources-shared/utils/translateData");
const { toParquet } = require("@etron/data-sources-shared/utils/typeConversion");
const { validateFormat } = require("@etron/data-sources-shared/utils/validateFormat");


async function localFileConversion(workspaceId, dataSourceId, uploadData) {
    const translatedData = translateData(uploadData);

    // wrap it in an array
    //const normalisedData = [translatedData];

    const {valid, error } = validateFormat(translatedData);

    // create the schema
    //const schema = generateSchema(translateData);

    // save the schema to S3
    //await saveSchema(workspaceId, dataSourceId, schema);

    if (!valid) throw new Error(`Invalid data format: ${error}`);

    return toParquet(translatedData);
}

module.exports = {
    localFileConversion
};