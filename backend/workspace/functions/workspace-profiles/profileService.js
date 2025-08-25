// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

async function createBoardInWorkspace(authUserId, workspaceId, data) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const boardId = uuidv4();
    const date = new Date().toISOString();

    // create a new board item
    const boardItem = {
        workspaceId: workspaceId,
        profileId: profileId,
        name: data.name,
        isDashboard: data.isDashboard,
        displayConfig: [{}],
        permissions: [{}],
        elements: [{}],
        config: data.config,
        layout: data.layout,
        createdAt: date,
        updatedAt: date
    };

    await workspaceRepo.addProfile(boardItem);

    return boardItem;
}

async function deleteProfileInWorkspace(authUserId, workspaceId, profileId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const profile = await workspaceRepo.getProfileById(workspaceId, profileId);

    if (!profile) {
        throw new Error("Profile not found");
    }

    await workspaceRepo.removeProfile(workspaceId, profileId);

    return {message: "Profile successfully removed"};
}

async function getProfileInWorkspace(authUserId, workspaceId, profileId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    return workspaceRepo.getProfileById(workspaceId, profileId);
}

async function getProfilesInWorkspace(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    return workspaceRepo.getProfilesByWorkspaceId(workspaceId);
}

async function updateProfileInWorkspace(authUserId, workspaceId, profileId, data) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const profile = await workspaceRepo.getProfileById(workspaceId, profileId);

    if (!profile) {
        throw new Error("Profile not found");
    }

    return workspaceRepo.updateProfile(workspaceId, profileId, data);
}

module.exports = {
    createBoardInWorkspace,
    deleteProfileInWorkspace,
    getProfileInWorkspace,
    getProfilesInWorkspace,
    updateProfileInWorkspace
};