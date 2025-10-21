const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");
const dataSourceRepo = require("@etron/day-book-shared/repositories/dataSourceRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");

const sfn = new SFNClient({});
const stateMachineArn = process.env.STATE_MACHINE_ARN;

exports.handler = async () => {
    // get all workspaces
  const workspaces = await workspaceRepo.getAllWorkspaces();
  const allDataSources = [];

  for (const workspace of workspaces) {
    // get all data sources in a workspace
    const dataSources = await dataSourceRepo.getDataSourcesByWorkspaceId(workspace.workspaceId);
    for (const ds of dataSources) {
      allDataSources.push({ workspaceId: workspace.workspaceId, dataSource: ds });
    }
  }

  await sfn.send(
    new StartExecutionCommand({
      stateMachineArn,
      input: JSON.stringify({ dataSources: allDataSources }),
    })
  );

  return { message: `Started polling for ${allDataSources.length} sources` };
};