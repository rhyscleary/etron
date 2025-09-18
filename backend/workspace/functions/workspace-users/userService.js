// Author(s): Rhys Cleary

const { UserType } = require("@etron/shared/constants/enums");
const workspaceInvitesRepo = require("@etron/shared/repositories/workspaceInvitesRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const { getUserByEmail } = require("@etron/shared/utils/auth");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

async function addUserToWorkspace(workspaceId, payload) {
    await validateWorkspaceId(workspaceId);

    const { inviteId } = payload;

    if (!inviteId || typeof inviteId !== "string") {
        throw new Error("Please specify a inviteId");
    }

    // get invite
    const invite = await workspaceInvitesRepo.getInviteById(workspaceId, inviteId);

    if (!invite) {
        throw new Error("Invite not found");
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

async function updateUserInWorkspace(authUserId, workspaceId, userId, payload) {
    await validateWorkspaceId(workspaceId);

    const { roleId } = payload;

    // check if the user exists
    const user = await workspaceUsersRepo.getUser(workspaceId, userId);

    if (!user) {
        throw new Error("User not found");
    }

    // check if the role exists
    const role = await workspaceRepo.getRoleById(workspaceId, roleId);

    if (!role) {
        throw new Error("Role not found:", roleId);
    }

    // check that the roleId isn't the owner
    // fetch the owner role id
    const ownerRoleId = await workspaceRepo.getOwnerRoleId(workspaceId);

    if (ownerRoleId === roleId) {
        throw new Error("A workspace is limited to one owner");
    }

    const updatedUserItem = {
        roleId
    };

    return workspaceUsersRepo.updateUser(workspaceId, userId, updatedUserItem);
}

async function getUserInWorkspace(authUserId, workspaceId, userId) {
    await validateWorkspaceId(workspaceId);

    return workspaceUsersRepo.getUser(workspaceId, userId);
}

async function getUsersInWorkspace(authUserId, workspaceId) {
    await validateWorkspaceId(workspaceId);

    return workspaceUsersRepo.getUsersByWorkspaceId(workspaceId);
}

async function removeUserFromWorkspace(authUserId, workspaceId, userId) {
    await validateWorkspaceId(workspaceId);

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