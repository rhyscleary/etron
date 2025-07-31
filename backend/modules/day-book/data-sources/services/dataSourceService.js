// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const getInvite = require("../invites/getInvite");
const { getUserByEmail } = require("../utils/auth");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

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
    await saveSecrets(workspaceId, dataSourceId, secrets);

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

    const { name, config, secrets } = payload;

    const dataSourceId = uuidv4();
    
    // create data source item and store in repo 
    const dataSourceItem = {
        name: name,
        config: config
    };

    await dataSourceRepo.updateDataSource(dataSourceItem);

    // store the secrets in parameter storage
    await saveSecrets(secrets);

    return {
        ...dataSourceItem,
        secrets
    };
}

async function getDataSourceInWorkspace(authUserId, workspaceId, dataSourceId) {

}

async function getDataSourcesInWorkspace(authUserId, workspaceId) {

}

async function deleteDataSourceInWorkspace(authUserId, workspaceId, dataSourceId) {
    const isAuthorised = await isOwner(authUserId, workspaceId) || await isManager(authUserId, workspaceId);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const dataSource = await workspaceRepo.getDataSourceById(workspaceId, dataSourceId);

    if (!dataSource) {
        throw new Error("Data Source not found");
    }

    // remove data source from repo and secrets
    await dataSourceRepo.removeDataSource(workspaceId, dataSourceId);

    await deleteSecrets(workspaceId, dataSourceId);

    return {message: "Data source successfully deleted"};
}

function pollDataSource(authUserId, workspaceId, dataSourceId) {

}

module.exports = {
    createDataSourceInWorkspace,
    updateDataSourceInWorkspace,
    getDataSourceInWorkspace,
    getAllDataSourcesInWorkspace,
    deleteDataSourceInWorkspace
};