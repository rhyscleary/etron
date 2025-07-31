// Author(s): Rhys Cleary

const dataSourceRepo = require("../repositories/dataSourceRepository");
const dataSourceSecretsRepo = require("../repositories/dataSourceSecretsRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

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
        status: "operational",
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

    const dataSource = await dataSourceRepo.getDataSourceById(dataSourceId);

    if (!dataSource) {
        throw new Error("The data source does not exist");
    }

    const { name, config, secrets } = payload;

    const dataSourceId = uuidv4();
    
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
    const dataSources = dataSourceRepo.getDataSourcesByWorkspaceId(workspaceId);

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

async function pollDataSource(workspaceId, dataSourceId) {
    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        throw new Error(`Data source "${dataSourceId}" not found`)
    }

    if (dataSource.status !== "operational") {
        return;
    }

    // get sources secrets
    // create adapter

    // try polling
    try {
        const result = await startPolling(adapter, dataSource.config, secrets);

    } catch (error) {
        const errorItem = {
            status: "error",
            errorMessage: error.message
        }

        await dataSourceRepo.updateDataSourceStatus(workspaceId, dataSourceId, errorItem);
    }

    async function startPolling(adapter, config, secrets) {
        
    }

}

module.exports = {
    createDataSourceInWorkspace,
    updateDataSourceInWorkspace,
    getDataSourceInWorkspace,
    getDataSourcesInWorkspace,
    deleteDataSourceInWorkspace,
    pollDataSource
};