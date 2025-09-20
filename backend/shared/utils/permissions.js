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
    const config = await getAppPermissions();

    if (!config) {
        return [];
    }

    const result = [];

    // get keys from the categories
    function getKeysFromCategories(categories, prefix) {
        if (!categories) return;

        for (const [categoryName, category] of Object.entries(categories)) {
            if (category.permissions) {
                for (const perm of category.permissions) {
                    if (perm.defaultStatus) {
                        result.push(`${prefix}.${perm.key}`);
                    }
                }
            }

            // recursive if nested category
            if (category.categories) {
                getKeysFromCategories(category.categories, `${prefix}.${categoryName}`);
            }
        }
    }

    // get app permission keys
    if (config.app?.categories) {
        getKeysFromCategories(config.app.categories, "app");
    }

    // handle the modules
    if (config.modules) {
        for (const [moduleName, module] of Object.entries(config.modules)) {
            getKeysFromCategories(module.categories, `modules.${moduleName}`);
        }
    }

    return result;
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