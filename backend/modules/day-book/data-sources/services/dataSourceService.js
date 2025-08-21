// Author(s): Rhys Cleary

const dataSourceRepo = require("../repositories/dataSourceRepository");
const dataSourceSecretsRepo = require("../repositories/dataSourceSecretsRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const { saveSourcedData } = require("@etron/shared/repositories/s3BucketRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');
const adapterFactory = require("../adapters/adapterFactory");

async function createDataSourceInWorkspace(authUserId, workspaceId, payload) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const { name, type, config, secrets } = payload;

    const dataSourceId = uuidv4();
    const date = new Date().toISOString();

    // create data source item and store in repo 
    const dataSourceItem = {
        workspaceId: workspaceId,
        dataSourceId: dataSourceId,
        name: name,
        type: type,
        status: "active",
        config: config,
        createdAt: date,
        lastUpdate: date
    };

    await dataSourceRepo.addDataSource(dataSourceItem);

    // store the secrets in parameter storage
    await dataSourceSecretsRepo.saveSecrets(workspaceId, dataSourceId, secrets);

    return {
        ...dataSourceItem,
        secrets
    };
}

async function updateDataSourceInWorkspace(authUserId, workspaceId, dataSourceId, payload) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        throw new Error("The data source does not exist");
    }

    const { name, config, secrets } = payload;
    
    // create data source item and store in repo 
    const dataSourceItem = {
        name: name,
        config: config
    };

    const updatedDataSource = await dataSourceRepo.updateDataSource(workspaceId, dataSourceId, dataSourceItem);

    // store the secrets in parameter storage
    await dataSourceSecretsRepo.saveSecrets(workspaceId, dataSourceId, secrets);

    return {
        ...updatedDataSource,
        secrets
    };
}

async function getDataSourceInWorkspace(authUserId, workspaceId, dataSourceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        return null;
    }

    const dataSourceSecrets = await dataSourceSecretsRepo.getSecrets(workspaceId, dataSourceId);

    return {
        ...dataSource,
        dataSourceSecrets
    }
}

async function getDataSourcesInWorkspace(authUserId, workspaceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // get data source details by workspace id
    const dataSources = await dataSourceRepo.getDataSourcesByWorkspaceId(workspaceId);

    // get secrets for data source
    const dataSourceSecrets = await dataSourceSecretsRepo.getSecretsByWorkspaceId(workspaceId);

    const combinedSources = dataSources.map(source => ({
        ...source,
        secrets: dataSourceSecrets[source.dataSourceId] || {}
    }));

    return combinedSources;
}

async function deleteDataSourceInWorkspace(authUserId, workspaceId, dataSourceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // get data source details
    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        throw new Error("Data Source not found");
    }

    // remove data source from repo and secrets
    await dataSourceRepo.removeDataSource(workspaceId, dataSourceId);

    await dataSourceSecretsRepo.removeSecrets(workspaceId, dataSourceId);

    return {message: "Data source successfully deleted"};
}

async function testConnection(authUserId, payload) {
    const { type, config, secrets } = payload;

    // try polling
    try {
        // create adapter
        const adapter = adapterFactory.getAdapter(type);

        const data = await adapter.poll(config, secrets);

        // return the data from the endpoint
        return { status: "success", data: data };

    } catch (error) {
        // if the data source fails polling return error
        const errorItem = {
            status: "error",
            errorMessage: error.message
        }

        return errorItem;
    }

}

async function pollDataSources() {
    const workspaces = await workspaceRepo.getAllWorkspaces();

    for (const workspace of workspaces) {
        const dataSources = await dataSourceRepo.getDataSourcesByWorkspaceId(workspace.workspaceId);

        for (const dataSource of dataSources) {

            // types of data to be polled
            const allowedTypes = ["api"];

            // check if the data source is active and an allowed type
            if (dataSource.status !== "active" || !allowedTypes.includes(dataSource.type)) {
                continue;
            }

            // get sources secrets
            const secrets = await dataSourceSecretsRepo.getSecrets(workspace.workspaceId, dataSource.dataSourceId);

            // create adapter
            const adapter = adapterFactory.getAdapter(dataSource.type);

            // try polling
            try {
                const data = await startPolling(adapter, dataSource.config, secrets);

                // save data to s3 bucket
                await saveSourcedData(workspace.workspaceId, dataSource.dataSourceId, data);

            } catch (error) {
                // if the data source fails three polls update it's status to error
                const errorItem = {
                    status: "error",
                    errorMessage: error.message
                }

                await dataSourceRepo.updateDataSourceStatus(workspace.workspaceId, dataSource.dataSourceId, errorItem);
            }
        }
    }
}

async function startPolling(adapter, config, secrets) {
    let currentError;

    for (let attempt = 0; attempt <= 3; attempt++) {
        try {
            return await adapter.poll(config, secrets);
        } catch (error) {
           currentError = error;  
        }
    }

    throw currentError;
}

module.exports = {
    createDataSourceInWorkspace,
    updateDataSourceInWorkspace,
    getDataSourceInWorkspace,
    getDataSourcesInWorkspace,
    deleteDataSourceInWorkspace,
    pollDataSources,
    testConnection
};