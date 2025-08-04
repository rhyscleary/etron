// Author(s): Rhys Cleary

const { GetObjectCommand, PutObjectCommand, NoSuchKey, S3Client, S3ServiceException } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({});

// get modules from s3
async function getAppModules() {
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
}

// save data polled for data sources to s3
async function saveSourcedData(workspaceId, dataSourceId, data) {
    const bucketName = "etron-day-book-sourced-data";
    const timestamp = new Date().toISOString();
    const key = `${workspaceId}/${dataSourceId}/${timestamp}.json`;

    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: JSON.stringify(data),
                ContentType: "application/json"
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

module.exports = {
    getAppModules,
    saveSourcedData
};