// Author(s): Rhys Cleary

const workspaceRepo = require("../shared/repositories/workspaceRepository");
const { isOwner, isManager } = require("../shared/utils/permissions");

async function createRoleInWorkspace(authUserId, workspaceId, data) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const roleId = uuidv4();
    const date = new Date().toISOString();

    // create a new role item
    const roleItem = {
        workspaceId: workspaceId,
        roleId: roleId,
        name: data.name,
        permissions: data.permissions,
        createdAt: date,
        updatedAt: date
    };

    await workspaceRepo.addRole(roleItem);

    return roleItem;
}

async function deleteRoleInWorkspace(authUserId, workspaceId, roleId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found");
    }

    await workspaceRepo.removeRole(workspaceId, roleId);

    return {message: "Role successfully deleted"};
}

async function getRoleInWorkspace(authUserId, workspaceId, roleId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    return role || null;
}

async function getRolesInWorkspace(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    return workspaceRepo.getRolesByWorkspaceId(workspaceId);
}

async function updateRoleInWorkspace(authUserId, workspaceId, roleId, data) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found");
    }

    return workspaceRepo.updateRole(workspaceId, roleId, data);
}

module.exports = {
    createRoleInWorkspace,
    deleteRoleInWorkspace,
    getRoleInWorkspace,
    getRolesInWorkspace,
    updateRoleInWorkspace
};