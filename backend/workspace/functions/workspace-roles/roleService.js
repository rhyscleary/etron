// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const workspaceUsersRepository = require ("@etron/shared/repositories/workspaceUsersRepository");
const { getDefaultPermissions } = require("@etron/shared/utils/permissions");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const {v4 : uuidv4} = require('uuid');

async function createRoleInWorkspace(authUserId, workspaceId, payload) {
    await validateWorkspaceId(workspaceId);

    const { name, permissions } = payload;

    if (!name || typeof name !== "string") {
        throw new Error("Please specify a name");
    }

    let rolePermissions = permissions;

    if (!rolePermissions) {
        // get the default permissions. Permissions with defaultStatus: true
        rolePermissions = await getDefaultPermissions();
    }

    if (!Array.isArray(rolePermissions)) {
        throw new Error("Permissions must be an array of strings");
    }

    for (const perm of rolePermissions) {
        if (typeof perm !== "string") {
            throw new Error("Each permission must be a string key");
        }
    }

    const roleId = uuidv4();
    const date = new Date().toISOString();

    // create a new role item
    const roleItem = {
        workspaceId: workspaceId,
        roleId: roleId,
        name: name,
        permissions: rolePermissions,
        createdAt: date,
        updatedAt: date
    };

    await workspaceRepo.addRole(roleItem);

    return roleItem;
}

async function deleteRoleInWorkspace(authUserId, workspaceId, roleId) {
    await validateWorkspaceId(workspaceId);

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found:", roleId);
    }

    // prevent deleting the Owner role
    if (role.owner) {
        throw new Error("You cannot delete the Owner role");
    }

    await workspaceRepo.removeRole(workspaceId, roleId);

    return {message: "Role successfully deleted"};
}

async function getRoleInWorkspace(authUserId, workspaceId, roleId) {
    await validateWorkspaceId(workspaceId);

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found:", roleId);
    }

    return role;
}

async function getRoleOfUserInWorkspace(authUserId, workspaceId) {
    await validateWorkspaceId(workspaceId);
    
    const user = await workspaceUsersRepository.getUserByUserId(authUserId);

    const role = await workspaceRepo.getRoleById(workspaceId, user.roleId);

    if (!role) {
        throw new Error("Role not found:", user.roleId);
    }

    return role;
}

async function getRolesInWorkspace(authUserId, workspaceId) {
    await validateWorkspaceId(workspaceId);

    return await workspaceRepo.getRolesByWorkspaceId(workspaceId);
}

async function updateRoleInWorkspace(authUserId, workspaceId, roleId, payload) {
    await validateWorkspaceId(workspaceId);

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found:", roleId);
    }

    const { name, permissions } = payload;

    if (name && typeof name !== "string") {
        throw new Error("'name' must be a string");
    }

    if (permissions) {
        if (!Array.isArray(permissions)) {
            throw new Error("Permissions must be an array of strings");
        }

        for (const perm of permissions) {
            if (typeof perm !== "string") {
                throw new Error("Each permission must be a string key");
            }
        }
    }

    return workspaceRepo.updateRole(workspaceId, roleId, payload);
}

module.exports = {
    createRoleInWorkspace,
    deleteRoleInWorkspace,
    getRoleInWorkspace,
    getRoleOfUserInWorkspace,
    getRolesInWorkspace,
    updateRoleInWorkspace
};