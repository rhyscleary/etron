// Author(s): Rhys Cleary

const { UserType } = require("@etron/shared/constants/enums");
const workspaceInvitesRepo = require("@etron/shared/repositories/workspaceInvitesRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

async function inviteUsertoWorkspace(authUserId, workspaceId, data) {
    if (!data.email || !data.type) {
        throw new Error("Missing required fields");
    }

    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // convert type to lowercase
    const type = data.type.toLowerCase();

    // check if the user type is valid
    if (!Object.values(UserType).includes(type)) {
        throw new Error(`Invalid type of user: ${type}`);
    }

    // if a role is specified check if it's valid
    if (data.roleId !== undefined) {
        
    }

    // check if the user exists in the workspace
    const user = workspaceUsersRepo.getUsersByWorkspaceIdAndEmail(workspaceId, data.email);

    if (user?.[0]) {
        return {message: "User is already part of the workspace"};
    }

    const existingInvites = workspaceInvitesRepo.getInvitesByWorkspaceIdAndEmail(workspaceId, data.email);  
    if (existingInvites?.[0]) {
        return {message: "User is already invited to the workspace"};
    }

    const inviteId = uuidv4();
    const dateObject = new Date();
    const date = dateObject.toISOString();
    const expireAt = Math.floor((dateObject.getTime() + 7 * 24 * 60 * 60 * 1000) / 1000);
    
    // create a new invite item
    const inviteItem = {
        workspaceId: workspaceId,
        inviteId: inviteId,
        email: data.email,
        type: type,
        roleId: data.roleId || null,
        status: "pending",
        createdAt: date,
        expireAt: expireAt
    };

    await workspaceInvitesRepo.addInvite(inviteItem);

    return inviteItem;
}

async function cancelInviteToWorkspace(authUserId, workspaceId, inviteId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const invite = await workspaceInvitesRepo.getInviteById(workspaceId, inviteId);

    if (!invite) {
        throw new Error("Invite not found");
    }

    await workspaceInvitesRepo.removeInviteById(workspaceId, inviteId);

    return {message: "Invite cancelled"};
}

async function cancelUsersInvites(email) {
    const invites = await workspaceInvitesRepo.getInvitesByEmail(email);

    if (invites.length === 0) {
        throw new Error("No workspace invitations found");
    }

    // delete invite
    for (let item of invites) {
        await workspaceInvitesRepo.removeInviteById(item.workspaceId, item.inviteId);
    }
    
    return {message: "Invites cancelled"}
}

async function getInvite(workspaceId, inviteId) {
    return workspaceInvitesRepo.getInviteById(workspaceId, inviteId);
}

async function getSentInvites(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    return workspaceInvitesRepo.getInvitesByWorkspaceId(workspaceId);
}

module.exports = {
    inviteUsertoWorkspace,
    cancelInviteToWorkspace,
    cancelUsersInvites,
    getInvite,
    getSentInvites
};