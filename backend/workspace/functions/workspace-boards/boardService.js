// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

async function createBoardInWorkspace(authUserId, workspaceId, payload) {


    const boardId = uuidv4();
    const date = new Date().toISOString();

    // create a new board item
    const boardItem = {
        workspaceId,
        boardId,
        name: payload.name,
        config: payload.config,
        createdAt: date,
        updatedAt: date
    };

    await workspaceRepo.addBoard(boardItem);

    return boardItem;
}

async function deleteBoardInWorkspace(authUserId, workspaceId, boardId) {


    const board = await workspaceRepo.getProfileById(workspaceId, boardId);

    if (!board) {
        throw new Error("Board not found");
    }

    await workspaceRepo.removeProfile(workspaceId, boardId);

    return {message: "Board successfully removed"};
}

async function getBoardInWorkspace(authUserId, workspaceId, boardId) {


    return workspaceRepo.getProfileById(workspaceId, boardId);
}

async function getBoardsInWorkspace(authUserId, workspaceId) {


    return workspaceRepo.getProfilesByWorkspaceId(workspaceId);
}

async function updateBoardInWorkspace(authUserId, workspaceId, boardId, payload) {


    const board = await workspaceRepo.getProfileById(workspaceId, boardId);

    if (!board) {
        throw new Error("Board not found");
    }

    return workspaceRepo.updateProfile(workspaceId, boardId, payload);
}

module.exports = {
    createBoardInWorkspace,
    deleteBoardInWorkspace,
    getBoardInWorkspace,
    getBoardsInWorkspace,
    updateBoardInWorkspace
};