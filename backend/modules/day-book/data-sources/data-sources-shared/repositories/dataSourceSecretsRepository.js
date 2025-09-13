// Author(s): Rhys Cleary
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
    SSMClient,
    PutParameterCommand,
    GetParameterCommand,
    DeleteParameterCommand,
    GetParametersByPathCommand
} = require("@aws-sdk/client-ssm");

const client = new SSMClient();

async function saveSecrets(workspaceId, dataSourceId, secrets) {
    const path = `/workspace/${workspaceId}/datasources`;
    
    let dataSourceRecords = {};
    try {
        const result = await client.send(new GetParameterCommand({
            Name: path,
            WithDecryption: true
        }));
        dataSourceRecords = JSON.parse(result.Parameter.Value);
    } catch (error) {
        if (error.name !== "ParameterNotFound") {
            throw error;
        }
    }

    dataSourceRecords[dataSourceId] = secrets;
    
    const command = new PutParameterCommand({
        Name: path,
        Value: JSON.stringify(dataSourceRecords),
        Type: "SecureString",
        Overwrite: true
    });

    await client.send(command);
}

async function getSecrets(workspaceId, dataSourceId) {
    const path = `/workspace/${workspaceId}/datasources`;

    try {
        const result = await client.send(new GetParameterCommand({
            Name: path,
            WithDecryption: true
        }));

        const dataSourceRecords = JSON.parse(result.Parameter.Value);

        return dataSourceRecords[dataSourceId] || {};
    } catch (error) {
        if (error.name === "ParameterNotFound") {
            return {};
        }
        throw error;
    }
}

async function getSecretsByWorkspaceId(workspaceId) {
    const path = `/workspace/${workspaceId}/datasources`;

    try {
        const result = await client.send(new GetParameterCommand({
            Name: path,
            WithDecryption: true
        }));

        return JSON.parse(result.Parameter.Value) || {};
    } catch (error) {
        if (error.name === "ParameterNotFound") {
            // there are not secrets for the workspace so return an empty object
            return {};
        }
        throw error;
    }
}

async function removeSecrets(workspaceId, dataSourceId) {
    const path = `/workspace/${workspaceId}/datasources`;
    
    const result = await client.send(new GetParameterCommand({
        Name: path,
        WithDecryption: true
    }));
    
    const dataSourceRecords = JSON.parse(result.Parameter.Value);
    
    delete dataSourceRecords[dataSourceId];
    
    await client.send(new PutParameterCommand({
        Name: path,
        Value: JSON.stringify(dataSourceRecords),
        Type: "SecureString",
        Overwrite: true
    }));
}

module.exports = {
    saveSecrets,
    getSecrets,
    getSecretsByWorkspaceId,
    removeSecrets
}