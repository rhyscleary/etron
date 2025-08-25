// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

async function createBoardInWorkspace(authUserId, workspaceId, data) {

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

async function deleteBoardInWorkspace(authUserId, workspaceId, profileId) {

    const profile = await workspaceRepo.getProfileById(workspaceId, profileId);

    if (!profile) {
        throw new Error("Board not found");
    }

    await workspaceRepo.removeBoard(workspaceId, profileId);

    return {message: "Board successfully removed"};
}

async function getBoardInWorkspace(authUserId, workspaceId, profileId) {
    return workspaceRepo.getProfileById(workspaceId, profileId);
}

async function getProfilesInWorkspace(authUserId, workspaceId) {
    return workspaceRepo.getProfilesByWorkspaceId(workspaceId);
}

async function updateProfileInWorkspace(authUserId, workspaceId, profileId, data) {
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