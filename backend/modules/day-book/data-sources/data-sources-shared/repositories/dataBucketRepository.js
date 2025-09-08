// Author(s): Rhys Cleary

const { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, NoSuchKey, S3Client, S3ServiceException } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({});
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketName = process.env.WORKSPACE_BUCKET;

function handleS3Error(error, message) {
    if (error instanceof S3ServiceException) {
        console.error(`${message}:`, error);
        throw new Error(message);
    } else {
        throw error;
    }
}

// save data polled for data sources to s3
async function saveStoredData(workspaceId, dataSourceId, data) {
    const timestamp = new Date().toISOString();
    const key = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/data/${timestamp}.parquet`;

    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: data,
                ContentType: "application/octet-stream"
            }),
        );

    } catch (error) {
        handleS3Error(error, `Error saving data to ${bucketName}`);
    }
}

// remove data
async function removeAllStoredData(workspaceId, dataSourceId) {
    const prefix = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/`;
    try {
        const objectList = await s3Client.send(
            new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: prefix
            }),
        );

        if (!objectList.Contents || objectList.Contents.length === 0) {
            console.log("No objects found for prefix:", prefix);
            return;
        }

        const deleteParams = {
            Bucket: bucketName,
            Delete: { Objects: objectList.Contents.map(object => ({ Key: object.Key })) }
        };

        await s3Client.send(new DeleteObjectsCommand(deleteParams));

    } catch (error) {
        handleS3Error(error, `Error removing stored data from ${bucketName}`);
    }
}

async function getStoredData(key) {
    try {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );

        return response.Body;
    } catch (error) {
        if (error.name === "NoSuchKey") {
            return null;
        }
        handleS3Error(error, `Error retrieving object ${key} from ${bucketName}`);
    }
}

async function getUploadUrl(workspaceId, dataSourceId) {
    const key = `workspaces/${workspaceId}/day-book/dataSources/uploads/${dataSourceId}.csv`;
    
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: "text/csv"
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        handleS3Error(error, `Error getting upload url from ${bucketName}`);
    }
}

async function getDownloadUrl(key) {
    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: "text/csv"
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        handleS3Error(error, `Error generating download url from ${bucketName}`);
    }
}

async function replaceStoredData(workspaceId, dataSourceId, data) {
    await removeAllStoredData(workspaceId, dataSourceId);
    await saveStoredData(workspaceId, dataSourceId, data);
}

async function getDataSchema(workspaceId, dataSourceId) {
    const key = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/schema.json`;

    try {
        const object = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );

        const schema = await streamToString(object.body);
        return JSON.parse(schema);
    } catch (error) {
        if (error.name === "NoSuchKey") {
            return null;
        }
        handleS3Error(error, `Error retrieving data schema ${key} from ${bucketName}`);
    }
}

async function saveSchema(workspaceId, dataSourceId, schema) {
    const key = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/schema.json`;

    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: JSON.stringify(schema, null, 2),
                ContentType: "application/json"
            }),
        );
    } catch (error) {
        handleS3Error(error, `Error saving data schema to ${bucketName}`);
    }
}

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
}

module.exports = {
    saveStoredData,
    removeAllStoredData,
    replaceStoredData,
    getUploadUrl,
    getDownloadUrl,
    getStoredData,
    getDataSchema,
    saveSchema
};