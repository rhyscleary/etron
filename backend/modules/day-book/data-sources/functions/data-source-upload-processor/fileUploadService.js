// Author(s): Rhys Cleary

const { saveSchema } = require("../../data-sources-shared/repositories/dataBucketRepository");
const { generateSchema } = require("../../data-sources-shared/utils/generateSchema");
const { translateData } = require("../../data-sources-shared/utils/translateData");
const { toParquet } = require("../../data-sources-shared/utils/typeConversion");
const { validateFormat } = require("../../data-sources-shared/utils/validateFormat");


async function localFileConversion(workspaceId, dataSourceId, uploadData) {
    const translatedData = translateData(uploadData);

    // wrap it in an array
    //const normalisedData = [translatedData];

    const {valid, error } = validateFormat(normalisedData);

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