// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const { getUserById } = require("@etron/shared/utils/auth");
const {v4 : uuidv4} = require('uuid');
const { isOwner, isManager, getDefaultPermissions } = require("@etron/shared/utils/permissions");

async function createWorkspace(authUserId, data) {
    if (!data.name) {
        throw new Error("Missing required field: 'name'");
    }

    if (typeof data.name !== "string") {
        throw new Error("Workspace name must be a 'string'");
    }

    // if a location is specified check if it's valid
    if (data.location != null && typeof data.location !== "string") {
        throw new Error("Workspace location must be a 'string'");
    }

    // if a description is specified check if it's valid
    if (data.description != null && typeof data.description !== "string") {
        throw new Error("Workspace description must be a 'string'");
    }

    const workspaceId = uuidv4();
    const date = new Date().toISOString();
    
    // create a new workspace item
    const workspaceItem = {
        workspaceId: workspaceId,
        sk: "meta",
        name: data.name,
        location: data.location || null,
        description: data.description || null,
        ownerId: authUserId,
        createdAt: date,
        updatedAt: date
    };

    await workspaceRepo.addWorkspace(workspaceItem);

    // search modules and add defaults to workspace

    // add owner and manager roles with permissions to workspace
    const ownerRoleId = uuidv4();
    const managerRoleId = uuidv4();
    const defaultPerms = await getDefaultPermissions();
    console.log(defaultPerms);

    const ownerPerms = defaultPerms.map(perm => perm.key);

    const excludedPerms = ["transfer_ownership", "delete_workspace"];

    const managerPerms = defaultPerms.map(perm => perm.key).filter(key => !excludedPerms.includes(key));

    const ownerRoleItem = {
        workspaceId: workspaceId,
        roleId: ownerRoleId,
        name: "Owner",
        permissions: ownerPerms,
        createdAt: date,
        updatedAt: date
    };

    const managerRoleItem = {
        workspaceId: workspaceId,
        roleId: managerRoleId,
        name: "Manager",
        permissions: managerPerms,
        createdAt: date,
        updatedAt: date
    };

    await workspaceRepo.addRole(ownerRoleItem);
    await workspaceRepo.addRole(managerRoleItem);

    // add user as an owner of the workspace. Get cognito user by sub
    const userProfile = await getUserById(authUserId);

    // create a new user item
    const userItem = {
        workspaceId: workspaceId,
        userId: authUserId,
        email: userProfile.email,
        given_name: userProfile.given_name,
        family_name: userProfile.family_name,
        type: "owner",
        roleId: ownerRoleId,
        joinedAt: date,
        updatedAt: date
    };

    await workspaceUsersRepo.addUser(userItem);

    return {
        workspaceId: workspaceId,
        name: data.name,
        location: data.location || null,
        description: data.description || null,
        ownerId: authUserId,
        createdAt: date,
        updatedAt: date
    };
}

async function updateWorkspace(authUserId, workspaceId, data) { 
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // validate data
    // if a name is specified check if it's valid
    if (data.name != null && typeof data.name !== "string") {
        throw new Error("Workspace description must be a 'string'");
    }

    // if a location is specified check if it's valid
    if (data.location != null && typeof data.location !== "string") {
        throw new Error("Workspace location must be a 'string'");
    }

    // if a description is specified check if it's valid
    if (data.description != null && typeof data.description !== "string") {
        throw new Error("Workspace description must be a 'string'");
    }

    const workspace = await workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    const updatedWorkspaceItem = workspaceRepo.updateWorkspace(workspaceId, data);

    return {
        workspaceId: workspaceId,
        name: updatedWorkspaceItem.name,
        location: updatedWorkspaceItem.location || null,
        description: updatedWorkspaceItem.description || null,
        ownerId: updateWorkspace.ownerId,
        createdAt: updateWorkspace.createdAt,
        updatedAt: updateWorkspace.updatedAt
    };

}

async function deleteWorkspace(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const workspace = await workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    if (authUserId !== workspace.ownerId) {
        throw new Error("Unauthorised user");
    }

    await workspaceRepo.removeWorkspace(workspaceId);

    return {message: "Workspace successfully deleted"};
}

async function getWorkspaceByWorkspaceId(workspaceId) {
    const workspace = await workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    return {
        workspaceId: workspace.workspaceId,
        name: workspace.name,
        location: workspace.location || null,
        description: workspace.description || null,
        ownerId: workspace.ownerId,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt
    };
}

async function getWorkspaceByUserId(authUserId) {
    // get user data
    const user = workspaceUsersRepo.getUserByUserId(authUserId);

    if (!user?.[0]) {
        throw new Error("No user found");
    }

    // get workspace data
    const workspace = await workspaceRepo.getWorkspaceById(user.workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    return {
        workspaceId: workspace.workspaceId,
        name: workspace.name,
        location: workspace.location || null,
        description: workspace.description || null,
        ownerId: workspace.ownerId,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt
    }
}

async function transferWorkspaceOwnership(authUserId, workspaceId, userId) {
    const isAuthorised = await isOwner(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // check if the owner is trying to perform this action on themselves
    if (authUserId === userId) {
        throw new Error("You cannot perform this action on yourself");
    }

    // check if the user exists in the workspace
    if (! await workspaceUsersRepo.getUser(workspaceId, userId)) {
        throw new Error("The user you are transferring ownership to does not exist");
    }

    const targetUserItem = {
        type: "owner",
        role: "Owner"
    };

    // update the user to owner
    await workspaceUsersRepo.updateUser(workspaceId, userId, targetUserItem);

    // remove ownership from the current user and make them manager
    const updatedUserItem = {
        type: "manager",
        role: "Manager"
    }

    const updatedUser = workspaceUsersRepo.updateUser(workspaceId, userId, updatedUserItem);

    return updatedUser;
}

async function getDefaultWorkspacePermissions() {
    return getDefaultPermissions();
}


module.exports = {
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceByWorkspaceId,
    getWorkspaceByUserId,
    transferWorkspaceOwnership,
    getDefaultWorkspacePermissions
};