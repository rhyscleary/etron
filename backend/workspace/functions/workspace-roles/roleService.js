// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const workspaceUsersRepository = require ("@etron/shared/repositories/workspaceUsersRepository");
const { isOwner, isManager, getDefaultPermissions } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

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

    if (role.name === "Owner" || role.name === "Manager") {
        throw new Error("You cannot delete this role")
    }

    await workspaceRepo.removeRole(workspaceId, roleId);

    return {message: "Role successfully deleted"};
}

// combine perms between the roles and the default
async function mergePermissions(role) {
    // get default perms and combine them with the role perms
    const defaultPerms = await getDefaultPermissions();

    if (role.permissions.length === 0) {
        role.permissions = defaultPerms;
        return role;
    }
    const rolePermissions = role.permissions;

    const mergedPerms = defaultPerms.map((permission) => ({
        ...permission,
        enabled: rolePermissions.includes(permission.key)
    }));

    role.permissions = mergedPerms;

    return role;
}

async function getRoleInWorkspace(authUserId, workspaceId, roleId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        return null;
    }

    // merge the roles permissions and return it
    return mergePermissions(role);
}

async function getRoleOfUserInWorkspace(authUserId, workspaceId) {
    const userRole = await workspaceUsersRepository.getUserByUserId(authUserId);

    const role = await workspaceRepo.getRoleById(workspaceId, userRole.roleId);

    if (!role) {
        return null;
    }

    // merge the roles permissions and return it
    return mergePermissions(role);
}

async function getRolesInWorkspace(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const roles = await workspaceRepo.getRolesByWorkspaceId(workspaceId);

    // merge each roles permissions
    const mergedRoles = await Promise.all(
        roles.map((role) => mergePermissions(role))
    );

    // return the merged roles
    return mergedRoles;
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
    getRoleOfUserInWorkspace,
    getRolesInWorkspace,
    updateRoleInWorkspace
};