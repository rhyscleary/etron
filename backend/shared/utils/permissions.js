// Author(s): Rhys Cleary
const workspaceUsersRepo = require("../repositories/workspaceUsersRepository");
const workspaceRepo = require("../repositories/workspaceRepository");
const { GetObjectCommand, NoSuchKey, S3Client, S3ServiceException } = require("@aws-sdk/client-s3");
const { getAppPermissions } = require("../repositories/appConfigBucketRepository");
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

// get the default permissions. Permissions with defaultStatus: true
async function getDefaultPermissions() {
    const permissionConfig = await getAppPermissions();

    if (!config) {
        return [];
    }

    const result = [];

    
}

// check if the user has permissions
async function hasPermission(userId, workspaceId, permissionKey) {
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

    // user does not have permission
    return false;
}

module.exports = {
    isManager,
    isOwner,
    getDefaultPermissions,
    hasPermission
};