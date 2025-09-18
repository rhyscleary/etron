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

    // check if role is specified
    if (!invite.roleId) {
        throw new Error("No roleId specified");
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
        roleId: invite.roleId,
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

    // check if the user exists
    const user = await workspaceUsersRepo.getUser(workspaceId, userId);

    if (!user) {
        throw new Error("User not found");
    }

    if (updateData.type) {
        // convert type to lowercase
        const type = updateData.type.toLowerCase();

        // check if the user type is valid
        if (!Object.values(UserType).includes(type)) {
            throw new Error(`Invalid type of user: ${type}`);
        }

        updateData.type = type;
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