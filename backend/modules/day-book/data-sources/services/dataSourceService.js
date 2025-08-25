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

    if (!type) {
        throw new Error("Please specify a type of data source");
    }

    if (!name || typeof name != "string") {
        throw new Error("Please specify a type of data source");
    }

    // try to get adapter (will also check if it exists)
    const adapter = adapterFactory.getAdapter(type);

    if (!adapter) {
        throw new Error("The data type sent is not supported");
    }

    // validate config
    const configValidation = adapter.validateConfig(config);
    if (!configValidation.valid) {
        throw new Error(configValidation.error);
    }

    // validate secrets
    const secretsValidation = adapter.validateSecrets(secrets, config?.authType);
    if (!secretsValidation.valid) {
        throw new Error(secretsValidation.error);
    }

    const dataSourceId = uuidv4();
    const date = new Date().toISOString();

    // create data source item and store in repo 
    const dataSourceItem = {
        workspaceId,
        dataSourceId,
        name,
        type,
        status: "active",
        config,
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

    // try to get adapter
    const adapter = adapterFactory.getAdapter(dataSource.type);

    if (!adapter) {
        throw new Error("The data type is not supported");
    }

    // validate config
    const configValidation = adapter.validateConfig(config);
    if (!configValidation.valid) {
        throw new Error(configValidation.error);
    }

    // validate secrets
    const secretsValidation = adapter.validateSecrets(secrets, config?.authType);
    if (!secretsValidation.valid) {
        throw new Error(secretsValidation.error);
    }
    
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

    const secrets = await dataSourceSecretsRepo.getSecrets(workspaceId, dataSourceId);

    return {
        ...dataSource,
        secrets
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

        // check if type of data source is valid
        if (!type) {
            throw new Error("Please specify a type of data source");
        }

        // try to get adapter (will also check if it exists)
        const adapter = adapterFactory.getAdapter(type);

        if (!adapter) {
            throw new Error("The data type sent is not supported");
        }

        // validate config
        const configValidation = adapter.validateConfig(config);
        if (!configValidation.valid) {
            throw new Error(configValidation.error);
        }

        // validate secrets
        const secretsValidation = adapter.validateSecrets(secrets, config?.authType);
        if (!secretsValidation.valid) {
            throw new Error(secretsValidation.error);
        }


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
    const allowedTypes = adapterFactory.getAllowedPollingTypes();

    for (const workspace of workspaces) {
        const dataSources = await dataSourceRepo.getDataSourcesByWorkspaceId(workspace.workspaceId);

        for (const dataSource of dataSources) {

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

    for (let attempt = 0; attempt < 3; attempt++) {
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