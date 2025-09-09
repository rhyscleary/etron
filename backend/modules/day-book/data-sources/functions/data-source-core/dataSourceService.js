// Author(s): Rhys Cleary

const dataSourceRepo = require("@etron/data-sources-shared/repositories/dataSourceRepository");
const dataSourceSecretsRepo = require("@etron/data-sources-shared/repositories/dataSourceSecretsRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const {v4 : uuidv4} = require('uuid');
const adapterFactory = require("@etron/data-sources-shared/adapters/adapterFactory");
const { saveStoredData, removeAllStoredData, getUploadUrl, getStoredData, getDataSchema, saveSchema } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { validateFormat } = require("@etron/data-sources-shared/utils/validateFormat");
const { translateData } = require("@etron/data-sources-shared/utils/translateData");
const { toParquet } = require("@etron/data-sources-shared/utils/typeConversion");
const { generateSchema } = require("@etron/data-sources-shared/utils/schema");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const { runQuery } = require("@etron/data-sources-shared/utils/athenaService");

async function createRemoteDataSource(authUserId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const { name, sourceType, method, expiry, config, secrets } = payload;

    if (!sourceType) {
        throw new Error("Please specify the type of data source");
    }

    if (!name || typeof name !== "string") {
        throw new Error("Please specify a type of data source");
    }

    if (method && !["overwrite", "extend"].includes(method)) {
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

async function createLocalDataSource(authUserId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const { name, sourceType, method, expiry } = payload;

    if (!sourceType) {
        throw new Error("Please specify the type of data source");
    }

    if (!name || typeof name !== "string") {
        throw new Error("Please specify a type of data source");
    }

    if (method && !["overwrite", "extend"].includes(method)) {
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

async function updateDataSourceInWorkspace(authUserId, dataSourceId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        throw new Error("The data source does not exist");
    }

    const { name, method, expiry, config, secrets } = payload;

    if (method && !["overwrite", "extend"].includes(method)) {
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
    if (secrets) {
        await dataSourceSecretsRepo.saveSecrets(workspaceId, dataSourceId, secrets);
    }

    return {
        ...updatedDataSource,
        secrets
    };
}

async function getDataSourceInWorkspace(authUserId, workspaceId, dataSourceId) {
    await validateWorkspaceId(workspaceId);

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
    await validateWorkspaceId(workspaceId);

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
    await validateWorkspaceId(workspaceId);

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

async function viewData(authUserId, workspaceId, dataSourceId, options = {}) {
    // get the schema from the dataSource
    const schema = await getDataSchema(workspaceId, dataSourceId);
    if (!schema || schema.length === 0) throw new Error("Schema not found for this data source");

    const columns = schema.map((column) => column.name).join(", ");
    const tableName = `ds_${dataSourceId}`;
    const database = process.env.ATHENA_DATABASE;
    const outputLocation = `s3://${process.env.WORKSPACE_BUCKET}/workspaces/${workspaceId}/day-book/athenaResults/`;

    const query = `SELECT ${columns} FROM ${tableName}`;

    const { data, nextToken, queryExecutionId } = await runQuery(
        query,
        database,
        outputLocation,
        options
    );

    return {
        data,
        schema,
        tableName,
        nextToken,
        queryExecutionId
    };
}

module.exports = {
    createRemoteDataSource,
    createLocalDataSource,
    updateDataSourceInWorkspace,
    getDataSourceInWorkspace,
    getDataSourcesInWorkspace,
    deleteDataSourceInWorkspace,
    testConnection,
    getRemotePreview,
    viewData
};