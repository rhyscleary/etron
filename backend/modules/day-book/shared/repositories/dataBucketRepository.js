// Author(s): Rhys Cleary

const { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, NoSuchKey, S3Client, S3ServiceException } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({});
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketName = process.env.WORKSPACE_BUCKET;

// save data polled for data sources to s3
async function saveStoredData(workspaceId, dataSourceId, data) {
    const timestamp = new Date().toISOString();
    const key = `${workspaceId}/dataSources/${dataSourceId}/${timestamp}.parquet`;

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
        if (error instanceof S3ServiceException) {
            console.error(`Error from S3 while saving data to ${bucketName}`);
            throw new Error(`Error from S3 while saving data to ${bucketName}`);
        } else {
            throw error;
        }
    }
}

// remove data
async function removeAllStoredData(workspaceId, dataSourceId) {
    const prefix = `${workspaceId}/dataSources/${dataSourceId}/`;
    try {
        const objectList = await s3Client.send(
            new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: prefix
            }),
        );

        const deleteParams = {
            Bucket: bucketName,
            Delete: { Objects: objectList.Contents.map(object => ({ Key: object.Key })) }
        };

        await s3Client.send(new DeleteObjectsCommand(deleteParams));

    } catch (error) {
        if (error instanceof S3ServiceException) {
            console.error(`Error removing stored data from ${bucketName}`);
            throw new Error(`Error removing stored data from ${bucketName}`);
        } else {
            throw error;
        }
    }
}

async function getUploadUrl(workspaceId, dataSourceId) {
    const key = `${workspaceId}/dataSources/uploads/${dataSourceId}.csv`;
    
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: "text/csv"
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        if (error instanceof S3ServiceException) {
            console.error(`Error getting url from ${bucketName}`);
            throw new Error(`Error getting url from ${bucketName}`);
        } else {
            throw error;
        }
    }
}

// get data from s3
/*async function getStoredData() {
    const bucketName = "etron-modules";
    const key = "modules.json"
    try {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );

        const jsonString = await response.Body.transformToString();
        const parsed = JSON.parse(jsonString);

        return parsed || [];
    } catch (error) {
        if (error instanceof S3ServiceException) {
            console.error(`Error from S3 while fetching the permissions from ${bucketName}`);
            throw new Error(`Error from S3 while fetching the permissions from ${bucketName}`);
        } else {
            throw error;
        }
    }
}*/

async function replaceStoredData(workspaceId, dataSourceId, data) {
    await removeAllStoredData(workspaceId, dataSourceId);
    await saveStoredData(workspaceId, dataSourceId, data);
}

module.exports = {
    saveStoredData,
    removeAllStoredData,
    replaceStoredData,
    getUploadUrl,
    //getStoredData
};