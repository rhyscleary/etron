// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const workspaceUsersRepository = require ("@etron/shared/repositories/workspaceUsersRepository");
const { isOwner, isManager, getDefaultPermissions } = require("@etron/shared/utils/permissions");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const {v4 : uuidv4} = require('uuid');

async function createRoleInWorkspace(authUserId, workspaceId, payload) {
    await validateWorkspaceId(workspaceId);

    const { name, permissions } = payload;

    if (!name || typeof name !== "string") {
        throw new Error("Please specify a name");
    }

    if (!permissions) {
        // get the default permissions
        
    }

    const roleId = uuidv4();
    const date = new Date().toISOString();

    // create a new role item
    const roleItem = {
        workspaceId: workspaceId,
        roleId: roleId,
        name: name,
        permissions: permissions,
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

    // get the owner role id
    const ownerRoleId = await workspaceRepo.getOwnerRoleId(workspaceId);

    if (role.roleId === ownerRoleId) {
        throw new Error("You cannot delete this role");
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
    await validateWorkspaceId(workspaceId);

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found:", roleId);
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
    await validateWorkspaceId(workspaceId);

    const roles = await workspaceRepo.getRolesByWorkspaceId(workspaceId);

    // merge each roles permissions
    const mergedRoles = await Promise.all(
        roles.map((role) => mergePermissions(role))
    );

    // return the merged roles
    return mergedRoles;
}

async function updateRoleInWorkspace(authUserId, workspaceId, roleId, payload) {
    await validateWorkspaceId(workspaceId);

    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found:", roleId);
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