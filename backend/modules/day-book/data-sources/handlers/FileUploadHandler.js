// Author(s): Rhys Cleary
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");
const { localFileConversion } = require("../services/dataSourceService");

const s3Client = new S3Client({});

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
        
        const uploadLocationRegex = /^([^/]+)\/day-book\/dataSources\/uploads\/(.+)$/;
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

        const dataSourceId = fileName.split(".")[0];
        const timestamp = new Date().toISOString();

        console.log(`Processing file ${fileName} in ${workspaceId}`);

        try {
            const data = await s3Client.send(
                new GetObjectCommand({ Bucket: bucket, Key: key })
            );

            const parquetBuffer = await localFileConversion(data.Body);

            // upload to s3
            const parquetKey = `${workspaceId}/day-book/dataSources/${dataSourceId}/${timestamp}.parquet`;
            await s3Client.send(
                new PutObjectCommand({ 
                    Bucket: bucket, 
                    Key: parquetKey,
                    Body: Readable.from(parquetBuffer), 
                })
            );

            console.log(`Uploaded parquet file to: ${parquetKey}`);

            
            // delete the original uploaded file
            await s3Client.send(
                new DeleteObjectCommand({ Bucket: bucket, Key: key })
            );

            console.log(`Deleted the original file: ${key}`);

        } catch (error) {
            console.error(`Failed to process ${fileName}:`, error);
        }
    }
    
}