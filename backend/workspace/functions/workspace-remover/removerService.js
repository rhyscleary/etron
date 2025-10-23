// Author(s): Rhys Cleary

const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const workspaceUsersRepo = require("@etron/shared/repositories/workspaceUsersRepository");
const workspaceInvitesRepo = require("@etron/shared/repositories/workspaceInvitesRepository");
//const auditLogRepo = require("@etron/shared/repositories/auditRepository");
const { updateUser } = require("@etron/shared/utils/auth");
const { deleteFolder } = require("@etron/shared/repositories/workspaceBucketRepository");

async function deleteWorkspace(authUserId, workspaceId) {
    const workspace = await workspaceRepo.getWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    if (authUserId !== workspace.ownerId) {
        throw new Error("Unauthorised user");
    }

    // get all users in workspace
    const users = await workspaceUsersRepo.getUsersByWorkspaceId(workspaceId);

    // set has_workspace to false
    for (const user of users) {
        await updateUser(user.userId, { "custom:has_workspace": "false" });
    }

    // delete users from workspace table
    await workspaceUsersRepo.removeAllUsers(workspaceId);
    // delete invites from table
    await workspaceInvitesRepo.removeAllInvites(workspaceId);
    // remove audits from table
    //await auditLogRepo.removeAllLogs(workspaceId);

    // fetch and remove modules
    const installedModules = await workspaceRepo.getModulesByWorkspaceId(workspaceId);

    for (const module of installedModules) {
        let normalisedKey;
        try {
            normalisedKey = module.key.replace(/_/g, "-");
            const { cleanupModule } = require(`@etron/${normalisedKey}-shared/cleanup/cleanupModule`);
            await cleanupModule(workspaceId);
        } catch (error) {
            console.error(`No cleanup logic found for module: ${normalisedKey}`, error.message)
        }
    }

    // remove the data from S3
    await deleteFolder(`workspaces/${workspaceId}/`);

    console.log("Hello");

    // remove workspace data from table
    await workspaceRepo.removeAllWorkspaceData(workspaceId);

    return {message: "Workspace successfully deleted"};
}

module.exports = {
    deleteWorkspace
};