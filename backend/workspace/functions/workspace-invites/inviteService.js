// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const workspaceInvitesRepo = require("@etron/shared/repositories/workspaceInvitesRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const {v4 : uuidv4} = require('uuid');
const { hasPermission } = require("@etron/shared/utils/permissions");

// Permissions for this service
const PERMISSIONS = {
    INVITE_USER: "app.collaboration.invite_user",
    CANCEL_INVITE: "app.collaboration.cancel_invite",
    VIEW_INVITES: "app.collaboration.view_invites"
};

async function inviteUsertoWorkspace(authUserId, workspaceId, payload) {
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.INVITE_USER);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    await validateWorkspaceId(workspaceId);

    const { email, roleId } = payload;

    if (!email || typeof email !== "string") {
        throw new Error("Please specify a email");
    }

    if (!roleId || typeof roleId !== "string") {
        throw new Error("Please specify a roleId");
    }

    // check the role is valid
    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found:", roleId);
    }

    // prevent assigning the Owner role to another user
    if (role.owner) {
        throw new Error("A workspace is limited to one owner");
    }

    // check if the user exists in the workspace
    const user = await workspaceUsersRepo.getUserByWorkspaceIdAndEmail(workspaceId, email);

    if (user) {
        return {message: "User is already part of the workspace"};
    }

    const existingInvite = await workspaceInvitesRepo.getInviteByWorkspaceIdAndEmail(workspaceId, email);  
    if (existingInvite) {
        return {message: "User is already invited to the workspace"};
    }

    const inviteId = uuidv4();
    const dateObject = new Date();
    const date = dateObject.toISOString();
    const expireAt = Math.floor((dateObject.getTime() + 7 * 24 * 60 * 60 * 1000) / 1000);
    
    // create a new invite item
    const inviteItem = {
        workspaceId,
        inviteId,
        email,
        roleId,
        status: "pending",
        createdAt: date,
        expireAt: expireAt
    };

    await workspaceInvitesRepo.addInvite(inviteItem);

    return inviteItem;
}

async function cancelInviteToWorkspace(authUserId, workspaceId, inviteId) {
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.CANCEL_INVITE);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    await validateWorkspaceId(workspaceId);

    const invite = await workspaceInvitesRepo.getInviteById(workspaceId, inviteId);

    if (!invite) {
        throw new Error("Invite not found:", inviteId);
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
    
    return {message: "Invites cancelled"};
}

async function getInvite(workspaceId, inviteId) {
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_INVITES);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    await validateWorkspaceId(workspaceId);

    return workspaceInvitesRepo.getInviteById(workspaceId, inviteId);
}

async function getSentInvites(authUserId, workspaceId) {
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_INVITES);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    await validateWorkspaceId(workspaceId);

    return workspaceInvitesRepo.getInvitesByWorkspaceId(workspaceId);
}

module.exports = {
    inviteUsertoWorkspace,
    cancelInviteToWorkspace,
    cancelUsersInvites,
    getInvite,
    getSentInvites
};