// Author(s): Rhys Cleary

const { localFileConversion } = require("../services/dataSourceService");

exports.handler = async (event) => {

    for (const record of event.Records) {
        if (record.eventName !== "ObjectCreated:Put") {
            continue;
        }
    
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

        if (bucket !== process.env.WORKSPACE_BUCKET) {
            continue;
        }

        const uploadLocationRegex = /^([^/]+)\/dataSources\/uploads\/(.+)$/;
        const match = key.match(uploadLocationRegex);

        if (!match) {
            console.log("Skipping. Interaction not in upload directory.");
            continue;
        }

        const workspaceId = match[1];
        const fileName = match[2];

        if (!workspaceId || !fileName) {
            console.warn("Missing workspaceId or fileName");
            continue;
        }

        console.log(`Processing file ${fileName} in ${workspaceId}`);
    }
    
}