// Author(s): Rhys Cleary
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");
const { localFileConversion } = require("../services/dataSourceService");

const s3Client = new S3Client({});

async function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
}

exports.handler = async (event) => {

    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    if (bucket !== process.env.WORKSPACE_BUCKET) {
        console.log("Skipping. Not the workspace bucket");
        return;
    }
    
    const uploadLocationRegex = /^workspaces\/([^/]+)\/day-book\/dataSources\/uploads\/(.+)$/;
    const match = key.match(uploadLocationRegex);

    if (!match) {
        console.log("Skipping. Interaction not in upload directory.");
        return;
    }

    const workspaceId = match[1];
    const fileName = match[2];

    if (!workspaceId || !fileName) {
        console.warn("Missing workspaceId or fileName");
        return;
    }

    const dataSourceId = fileName.split(".")[0];
    const timestamp = new Date().toISOString();

    console.log(`Processing file ${fileName} in ${workspaceId}`);

    try {
        const data = await s3Client.send(
            new GetObjectCommand({ Bucket: bucket, Key: key })
        );

        // convert the stream to a string
        const stringFile = await streamToString(data.Body);

        const parquetBuffer = await localFileConversion(stringFile);

        // upload to s3
        const parquetKey = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/${timestamp}.parquet`;
        await s3Client.send(
            new PutObjectCommand({ 
                Bucket: bucket, 
                Key: parquetKey,
                Body: parquetBuffer, 
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