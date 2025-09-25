// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const appConfigRepo = require("@etron/shared/repositories/appConfigBucketRepository");
const { getUserById, updateUser } = require("@etron/shared/utils/auth");
const {v4 : uuidv4} = require('uuid');

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

    // check if user already owns a workspace, if so stop creation
    const existingWorkspace = await workspaceRepo.getWorkspaceByOwnerId(authUserId);
    if (existingWorkspace && existingWorkspace.length > 0) {
        return {message: "User has already created a workspace"}
    };

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

    // add dashboard board to the workspace

    // add owner and manager roles with permissions to workspace
    const ownerRoleId = uuidv4();
    const managerRoleId = uuidv4();
    const employeeRoleId = uuidv4();

    const starterRolePerms = await appConfigRepo.getStarterPermissions();

    // create role items
    const ownerRoleItem = {
        workspaceId: workspaceId,
        roleId: ownerRoleId,
        name: "Owner",
        owner: true,
        permissions: [],
        createdAt: date,
        updatedAt: date
    };

    const managerRoleItem = {
        workspaceId: workspaceId,
        roleId: managerRoleId,
        name: "Manager",
        permissions: starterRolePerms.manager,
        createdAt: date,
        updatedAt: date
    };

    const employeeRoleItem = {
        workspaceId,
        roleId: employeeRoleId,
        name: "Employee",
        permissions: starterRolePerms.employee,
        createdAt: date,
        updatedAt: date
    }

    await workspaceRepo.addRole(ownerRoleItem);
    await workspaceRepo.addRole(managerRoleItem);
    await workspaceRepo.addRole(employeeRoleItem);

    // add user as an owner of the workspace. Get cognito user by sub
    const userProfile = await getUserById(authUserId);

    // create a new user item
    const userItem = {
        workspaceId: workspaceId,
        userId: authUserId,
        email: userProfile.email,
        given_name: userProfile.given_name,
        family_name: userProfile.family_name,
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

async function updateWorkspace(authUserId, workspaceId, payload) {
    
    const { name, location, description } = payload;

    // validate data
    // if a name is specified check if it's valid
    if (name != null && typeof name !== "string") {
        throw new Error("Workspace description must be a 'string'");
    }

    // if a location is specified check if it's valid
    if (location != null && typeof location !== "string") {
        throw new Error("Workspace location must be a 'string'");
    }

    // if a description is specified check if it's valid
    if (description != null && typeof description !== "string") {
        throw new Error("Workspace description must be a 'string'");
    }

    const workspace = await workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    return workspaceRepo.updateWorkspace(workspaceId, payload);
}

async function deleteWorkspace(authUserId, workspaceId) {

    const workspace = await workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    if (authUserId !== workspace.ownerId) {
        throw new Error("Unauthorised user");
    }

    // get all users in workspace
    const users = await workspaceUsersRepo.getUsersByWorkspaceId(workspaceId);

    // set has_workspace to false
    for (const user of users) {
        await updateUser(user.userId, { "custom:has_workspace": "false" });
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

async function getWorkspaceByUserId(userId) {
    // get user data
    const user = await workspaceUsersRepo.getUserByUserId(userId);

    if (!user) {
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

async function transferWorkspaceOwnership(authUserId, workspaceId, payload) {

    const { receipientUserId, newRoleId } = payload;

    if (!receipientUserId) {
        throw new Error("Please specify the receipient UserId")
    }

    if (!newRoleId) {
        throw new Error("Please specify the new roleId")
    }

    // check if the owner is trying to perform this action on themselves
    if (authUserId === receipientUserId) {
        throw new Error("You cannot perform this action on yourself");
    }

    // check if the user exists in the workspace
    if (! await workspaceUsersRepo.getUser(workspaceId, receipientUserId)) {
        throw new Error("The user you are transferring ownership to does not exist");
    }

    // fetch the new role
    const newRole = await workspaceRepo.getRoleById(workspaceId, newRoleId);

    if (!newRole) {
        throw new Error(`Invalid roleId: ${newRoleId}`);
    }

    // fetch the owner role
    const ownerRoleId = await workspaceRepo.getOwnerRoleId(workspaceId);

    const targetUserItem = {
        roleId: ownerRoleId
    };

    // update the user to owner
    const newOwner = await workspaceUsersRepo.updateUser(workspaceId, receipientUserId, targetUserItem);

    // remove ownership from the current user and make them manager
    const updatedUserItem = {
        roleId: newRole.roleId
    }

    const updatedUser = await workspaceUsersRepo.updateUser(workspaceId, authUserId, updatedUserItem);

    return {
        newOwner,
        oldOwner: updatedUser
    }
}

// returns the app permissions
async function getWorkspacePermissions() {
    return appConfigRepo.getAppPermissions();
}

module.exports = {
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceByWorkspaceId,
    getWorkspaceByUserId,
    transferWorkspaceOwnership,
    getWorkspacePermissions
};