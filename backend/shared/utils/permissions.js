// Author(s): Rhys Cleary
const workspaceUsersRepo = require("../repositories/workspaceUsersRepository");
const workspaceRepo = require("../repositories/workspaceRepository");
const { GetObjectCommand, NoSuchKey, S3Client, S3ServiceException } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({});

async function isManager(userId, workspaceId) {
    if (!userId || typeof userId !== "string") {
        throw new Error("Invalid or missing userId");
    }

    if (!workspaceId || typeof workspaceId !== "string") {
        throw new Error("Invalid or missing workspaceId");
    }

    const user = await workspaceUsersRepo.getUser(workspaceId, userId);

    return user?.type === "manager";
}

async function isOwner(userId, workspaceId) {
    if (!userId || typeof userId !== "string") {
        throw new Error("Invalid or missing userId");
    }

    if (!workspaceId || typeof workspaceId !== "string") {
        throw new Error("Invalid or missing workspaceId");
    }

    const user = await workspaceUsersRepo.getUser(workspaceId, userId);

    return user?.type === "owner";
}

// get permissions from s3
async function getDefaultPermissions() {
    const bucketName = "etron-default-permissions";
    const key = "default-permissions.json"
    try {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );

        const jsonString = await response.Body.transformToString();
        const parsed = JSON.parse(jsonString);

        return parsed.permissions || [];
    } catch (error) {
        if (error instanceof S3ServiceException) {
            console.error(`Error from S3 while fetching the permissions from ${bucketName}`);
            throw new Error(`Error from S3 while fetching the permissions from ${bucketName}`);
        } else {
            throw error;
        }
    }
}

// check if the user has permissions
async function hasAuthority(userId, workspaceId, permissionKey) {
    if (!userId || typeof userId !== "string") {
        throw new Error("Invalid or missing userId");
    }

    if (!workspaceId || typeof workspaceId !== "string") {
        throw new Error("Invalid or missing workspaceId");
    }

    const user = await workspaceUsersRepo.getUser(workspaceId, userId);

    if (user?.roleId) {
        const role = workspaceRepo.getRoleById(workspaceId, user.roleId);

        if (role?.permissions?.includes(permissionKey)) {
            return true;
        }
    }

    // check default permissions in s3
    const defaultPermissions = await getDefaultPermissions();
    const permission = defaultPermissions.find(perm => perm.key === permissionKey);

    return permission?.enabled;
}

module.exports = {
    isManager,
    isOwner,
    hasAuthority,
    getDefaultPermissions
};