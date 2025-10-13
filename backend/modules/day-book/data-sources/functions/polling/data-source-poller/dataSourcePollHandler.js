// Author(s): Rhys Cleary

const { pollDataSource } = require("./pollService");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");

exports.handler = async (event) => {
    try {
        const { workspaceId, dataSource } = event;

        // get workspace details
        const workspace = await workspaceRepo.getWorkspaceById(workspaceId);

        await pollDataSource(workspace, dataSource);

        return {success: true, dataSourceId: dataSource.dataSourceId};

    } catch (error) {
        console.error("Polling error", error);
        return {success: false, error: error.message};
    }
};