// Author(s): Rhys Cleary

const { UserType } = require("@etron/shared/constants/enums");
const workspaceInvitesRepo = require("@etron/shared/repositories/workspaceInvitesRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const { getUserByEmail } = require("@etron/shared/utils/auth");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

async function addUserToWorkspace(workspaceId, inviteId) {
    // get invite
    const invite = await workspaceInvitesRepo.getInviteById(workspaceId, inviteId);

    if (!invite) {
        throw new Error("Invite not found");
    }

    // check if the user type is valid
    if (!Object.values(UserType).includes(invite.type)) {
        throw new Error(`Invalid type of user: ${invite.type}`);
    }

    // if role is specified check if it's valid
    if (invite.roleId !== undefined) {
    
    }

    // get cognito user by email
    const userProfile = await getUserByEmail(invite.email);

    const date = new Date().toISOString();
    
    // create a new user item
    const userItem = {
        workspaceId: workspaceId,
        userId: userProfile.userId,
        email: userProfile.email,
        given_name: userProfile.given_name,
        family_name: userProfile.family_name,
        type: invite.type,
        roleId: invite.roleId || null,
        joinedAt: date,
        updatedAt: date
    };

    await workspaceUsersRepo.addUser(userItem);

    // now user is added to workspace remove all other invites
    const userInvites = await workspaceInvitesRepo.getInvitesByEmail(userProfile.email);

    if (userInvites.length === 0) {
        throw new Error("No workspace invitations found to remove");
    }
    
    // delete invites
    for (let item of userInvites) {
        await workspaceInvitesRepo.removeInviteById(item.workspaceId, item.inviteId);
    }

    return userItem;

}

async function updateUserInWorkspace(authUserId, workspaceId, userId, updateData) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // check if the user exists
    const user = await workspaceUsersRepo.getUser(workspaceId, userId);

    if (!user) {
        throw new Error("User not found");
    }

    // check if the types valid
    if (updateData.type !== undefined) {
        const validTypes = Object.values(UserType);
        if (!validTypes.includes(updateData.type)) {
            throw new Error(`Invalid type of user: ${updateData.type}`);
        }
    }

    // check if the role exists
    if (updateData.roleId !== undefined) {
        
    }

    return workspaceUsersRepo.updateUser(workspaceId, userId, updateData);
}

async function getUserInWorkspace(authUserId, workspaceId, userId) {
    return workspaceUsersRepo.getUser(workspaceId, userId);
}

async function getUsersInWorkspace(authUserId, workspaceId) {
    return workspaceUsersRepo.getUsersByWorkspaceId(workspaceId);
}

async function removeUserFromWorkspace(authUserId, workspaceId, userId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    await workspaceUsersRepo.removeUser(workspaceId, userId);

    return {message: "User successfully removed"};
}

module.exports = {
    addUserToWorkspace,
    updateUserInWorkspace,
    getUserInWorkspace,
    getUsersInWorkspace,
    removeUserFromWorkspace
};