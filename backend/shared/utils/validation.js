// Author(s): Rhys Cleary
const workspaceRepo = require("../repositories/workspaceRepository");

async function validateWorkspaceId(workspaceId) {
    const workspace = await workspaceRepo.getWorkspaceById(workspaceId);
    if (!workspace) {
        const error = new Error(`Workspace ${workspaceId} not found`);
        error.statusCode = 404;
        throw error;
    }
    return workspace;
}
module.exports = {
    validateWorkspaceId
};