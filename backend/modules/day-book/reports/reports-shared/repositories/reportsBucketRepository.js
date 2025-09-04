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

// remove object
async function deleteFolder(folderPrefix) {
    if (!folderPrefix.endsWith("/")) {
        folderPrefix += "/";
    }

    try {
        const objectList = await s3Client.send(
            new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: folderPrefix
            }),
        );

        if (!objectList.Contents || objectList.Contents.length === 0) {
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

async function getUploadUrl(key, { ContentType }) { 
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType
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
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        handleS3Error(error, `Error generating download url from ${bucketName}`);
    }
}

module.exports = {
    deleteFolder,
    getUploadUrl,
    getDownloadUrl
};