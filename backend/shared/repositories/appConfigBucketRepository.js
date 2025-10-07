// Author(s): Rhys Cleary

const { GetObjectCommand, S3Client, S3ServiceException } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({});

const bucketName = process.env.APP_CONFIGURATION_BUCKET;

function handleS3Error(error, message) {
    if (error instanceof S3ServiceException) {
        console.error(`${message}:`, error);
        throw new Error(message);
    } else {
        throw error;
    }
}

// get app permissions from S3
async function getAppPermissions() {
    const key = `permissions/app-permissions.json`;
    try {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );

        const jsonString = await response.Body.transformToString();
        const parsed = JSON.parse(jsonString);

        return parsed;
    } catch (error) {
        if (error.name === "NoSuchKey") {
            return null;
        }
        handleS3Error(error, `Error retrieving object ${key} from ${bucketName}`);
    }
}

// get preset permissions for starter roles
async function getStarterPermissions() {
    const key = `permissions/starter-roles.json`;
    try {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );

        const jsonString = await response.Body.transformToString();
        const parsed = JSON.parse(jsonString);

        return parsed;
    } catch (error) {
        if (error.name === "NoSuchKey") {
            return null;
        }
        handleS3Error(error, `Error retrieving object ${key} from ${bucketName}`);
    }
}

// get modules from s3
async function getAppModules() {
    const key = "modules/modules.json"
    try {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );

        const jsonString = await response.Body.transformToString();
        const parsed = JSON.parse(jsonString);

        return parsed;
    } catch (error) {
        if (error.name === "NoSuchKey") {
            return null;
        }
        handleS3Error(error, `Error retrieving object ${key} from ${bucketName}`);
    }
}

module.exports = {
    getAppPermissions,
    getStarterPermissions,
    getAppModules
};