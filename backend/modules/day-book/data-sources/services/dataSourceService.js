// Author(s): Rhys Cleary

const dataSourceRepo = require("../repositories/dataSourceRepository");
const dataSourceSecretsRepo = require("../repositories/dataSourceSecretsRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const {v4 : uuidv4} = require('uuid');
const adapterFactory = require("../adapters/adapterFactory");
const { saveStoredData, removeAllStoredData, getUploadUrl } = require("../repositories/dataBucketRepository");
const { validateFormat } = require("../utils/validateFormat");
const { translateData } = require("../utils/translateData");
const { toParquet } = require("../utils/typeConversion");

async function createRemoteDataSource(authUserId, workspaceId, payload) {

    const { name, sourceType, method, expiry, config, secrets } = payload;

    if (!sourceType) {
        throw new Error("Please specify the type of data source");
    }

    if (!name || typeof name !== "string") {
        throw new Error("Please specify a type of data source");
    }

    if (typeof method !== "string" && (method !== "overwrite" || method !== "extend")) {
        throw new Error("Please specify the method 'overwrite' or 'extend'");
    }

    if (method === "extend") {
        if (expiry && typeof expiry !== "object") {
            throw new Error("Expiry is not in the correct format");
        }
    }

    // try to get adapter (will also check if it exists)
    const adapter = adapterFactory.getAdapter(sourceType);

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
        sourceType,
        method: method || "overwrite",
        expiry: expiry || null,
        status: "active",
        createdBy: authUserId,
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

async function createLocalDataSource(authUserId, workspaceId, payload) {

    const { name, sourceType, method, expiry } = payload;

    if (!sourceType) {
        throw new Error("Please specify the type of data source");
    }

    if (!name || typeof name !== "string") {
        throw new Error("Please specify a type of data source");
    }

    if (typeof method !== "string" && (method !== "overwrite" || method !== "extend")) {
        throw new Error("Please specify the method 'overwrite' or 'extend'");
    }

    if (method === "extend") {
        if (expiry && typeof expiry !== "object") {
            throw new Error("Expiry is not in the correct format");
        }
    }

    // try to get adapter (will also check if it exists)
    const adapter = adapterFactory.getAdapter(sourceType);

    if (!adapter) {
        throw new Error("The data type sent is not supported");
    }

    const dataSourceId = uuidv4();
    const date = new Date().toISOString();

    // create data source item and store in repo 
    const dataSourceItem = {
        workspaceId,
        dataSourceId,
        name,
        sourceType,
        method: method || "overwrite",
        expiry: expiry || null,
        status: "pending_upload",
        createdBy: authUserId,
        createdAt: date,
        lastUpdate: date
    };

    await dataSourceRepo.addDataSource(dataSourceItem);
    const uploadUrl = await getUploadUrl(workspaceId, dataSourceId);

    return {
        ...dataSourceItem,
        uploadUrl
    };
}

async function updateDataSourceInWorkspace(authUserId, workspaceId, dataSourceId, payload) {

    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        throw new Error("The data source does not exist");
    }

    const { name, method, expiry, config, secrets } = payload;

    if (method && typeof method !== "string" && method !== "overwrite" || "extend") {
            throw new Error("Please specify the method 'overwrite' or 'extend'");
        }

    if (method === "extend") {
        if (expiry && typeof expiry !== "object") {
            throw new Error("Expiry is not in the correct format");
        }
    }

    // try to get adapter
    const adapter = adapterFactory.getAdapter(dataSource.sourceType);

    if (!adapter) {
        throw new Error("The data type is not supported");
    }

    // validate config
    if (config) {
        const configValidation = adapter.validateConfig(config);
        if (!configValidation.valid) {
            throw new Error(configValidation.error);
        }
    }

    // validate secrets
    if (secrets) {
        const secretsValidation = adapter.validateSecrets(secrets, config?.authType);
        if (!secretsValidation.valid) {
            throw new Error(secretsValidation.error);
        }
    }
    
    // create data source item and store in repo 
    const dataSourceItem = {
        name,
        method,
        expiry,
        config
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

    // get data source details by workspace id
    const dataSources = await dataSourceRepo.getDataSourcesByWorkspaceId(workspaceId);
    return dataSources;  //temporarily here until getSecretsByWorkspaceId ceases to give "ParameterNotFound:UnknownError" and halting the process

    // get secrets for data source
    //const dataSourceSecrets = await dataSourceSecretsRepo.getSecretsByWorkspaceId(workspaceId);

    /*const combinedSources = dataSources.map(source => ({
        ...source,
        secrets: dataSourceSecrets[source.dataSourceId] || {}
    }));

    return combinedSources;*/
}

async function deleteDataSourceInWorkspace(authUserId, workspaceId, dataSourceId) {

    // get data source details
    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        throw new Error("Data Source not found");
    }

    // remove data from bucket
    await removeAllStoredData(workspaceId, dataSourceId);

    // remove data source from repo and secrets
    await dataSourceRepo.removeDataSource(workspaceId, dataSourceId);

    await dataSourceSecretsRepo.removeSecrets(workspaceId, dataSourceId);

    return {message: "Data source successfully deleted"};
}

async function testConnection(authUserId, payload) {
    const { sourceType, config, secrets } = payload;

    // try polling
    try {

        // check if type of data source is valid
        if (!sourceType) {
            throw new Error("Please specify a type of data source");
        }

        // try to get adapter (will also check if it exists)
        const adapter = adapterFactory.getAdapter(sourceType);

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

// get a preview of the data translated from the data source
async function getRemotePreview(authUserId, payload) {
    const { sourceType, config, secrets } = payload;

    try {
        // check if type of data source is valid
        if (!sourceType) {
            throw new Error("Please specify a type of data source");
        }

        // try to get adapter (will also check if it exists)
        const adapter = adapterFactory.getAdapter(sourceType);

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

        // fetch data
        const data = await adapter.poll(config, secrets);

        // translate the data
        const translatedData = translateData(data);

        const {valid, error } = validateFormat(translatedData);
        if (!valid) throw new Error(`Invalid data format: ${error}`);

        // return the data
        return translateData.slice(0, 50);

    } catch (error) {
        // if the data source fails polling return error
        const errorItem = {
            status: "error",
            errorMessage: error.message
        }

        return errorItem;
    }
}

function getAvailableSpreadsheets(authUserId, payload) {
    const {  } = payload;
}

async function viewData(authUserId, dataSourceId) {
    // get the data from s3
    const key = "";
    // validate the data format

}

async function fetchData() {
    const workspaces = await workspaceRepo.getAllWorkspaces();
    const allowedTypes = adapterFactory.getAllowedPollingTypes();

    for (const workspace of workspaces) {
        const dataSources = await dataSourceRepo.getDataSourcesByWorkspaceId(workspace.workspaceId);

        for (const dataSource of dataSources) {

            // check if the data source is active and an allowed type
            if (dataSource.status !== "active" || !allowedTypes.includes(dataSource.sourceType)) {
                continue;
            }

            // get sources secrets
            const secrets = await dataSourceSecretsRepo.getSecrets(workspace.workspaceId, dataSource.dataSourceId);

            // create adapter
            const adapter = adapterFactory.getAdapter(dataSource.sourceType);

            // try polling
            try {
                const newData = await poll(adapter, dataSource.config, secrets);
                const translatedData = translateData(newData);

                const {valid, error } = validateFormat(translatedData);
                if (!valid) throw new Error(`Invalid data format: ${error}`);

                const parquetBuffer = await toParquet(translatedData);

                if (dataSource.method === "extend") {
                    // extend the data source
                    await saveStoredData(workspace.workspaceId, dataSource.dataSourceId, parquetBuffer);

                } else {
                    // replace data
                    await replaceStoredData(workspace.workspaceId, dataSource.dataSourceId, parquetBuffer);
                }

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

async function poll(adapter, config, secrets) {
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

async function localFileConversion(uploadData) {
    const translatedData = translateData(uploadData);

    // wrap it in an array
    const normalisedData = [translatedData];

    const {valid, error } = validateFormat(normalisedData);
    if (!valid) throw new Error(`Invalid data format: ${error}`);

    return toParquet(translatedData);
}

module.exports = {
    createRemoteDataSource,
    createLocalDataSource,
    updateDataSourceInWorkspace,
    getDataSourceInWorkspace,
    getDataSourcesInWorkspace,
    deleteDataSourceInWorkspace,
    fetchData,
    testConnection,
    getRemotePreview,
    localFileConversion
};