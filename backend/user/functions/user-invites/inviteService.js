// Author(s): Rhys Cleary

const workspaceInvitesRepo = require("@etron/shared/repositories/workspaceInvitesRepository");

async function getUserInvites(email) {
    return await workspaceInvitesRepo.getInvitesByEmail(email);
}

module.exports = {
    getUserInvites
};