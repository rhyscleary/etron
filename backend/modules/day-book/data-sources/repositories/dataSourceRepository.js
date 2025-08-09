// Author(s): Rhys Cleary
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
    DynamoDBDocumentClient, 
    PutCommand, 
    GetCommand, 
    DeleteCommand, 
    UpdateCommand,
    QueryCommand 
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

const tableName = "DataSources";

// add datasource
async function addDataSource(dataSourceItem) {
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: dataSourceItem
        })
    );
}

// update datasource
async function updateDataSource(workspaceId, dataSourceId, dataSourceItem) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (dataSourceItem.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = dataSourceItem.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (dataSourceItem.config !== undefined) {
        updateFields.push("#config = :config");
        expressionAttributeValues[":config"] = dataSourceItem.config;
        expressionAttributeNames["#config"] = "config";
    }

    updateFields.push("#lastUpdate = :lastUpdate");
    expressionAttributeValues[":lastUpdate"] = new Date().toISOString();
    expressionAttributeNames["#lastUpdate"] = "lastUpdate";

    const result = await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                dataSourceId: dataSourceId
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "ALL_NEW"
        })
    );

    return result.Attributes;
}

// update datasource status
async function updateDataSourceStatus(workspaceId, dataSourceId, statusItem) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    updateFields.push("#status = :status");
    expressionAttributeValues[":status"] = statusItem.status;
    expressionAttributeNames["#status"] = "status";

    updateFields.push("#error = :error");
    expressionAttributeValues[":error"] = statusItem.errorMessage;
    expressionAttributeNames["#error"] = "error";
    

    updateFields.push("#lastUpdate = :lastUpdate");
    expressionAttributeValues[":lastUpdate"] = new Date().toISOString();
    expressionAttributeNames["#lastUpdate"] = "lastUpdate";

    await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                dataSourceId: dataSourceId
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
        })
    );
}

// remove datasource
async function removeDataSource(workspaceId, dataSourceId) {
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                dataSourceId: dataSourceId
            },
        })
    );
}

// get datasource by id
async function getDataSourceById(workspaceId, dataSourceId) {
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                dataSourceId: dataSourceId
            }
        })
    );
    
    return result.Item;
}

// get data sources by workspaceId
async function getDataSourcesByWorkspaceId(workspaceId) {
    const result = await dynamoDB.send(
        new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "workspaceId = :workspaceId",
            ExpressionAttributeValues: {
                ":workspaceId": workspaceId
            }
        })
    );

    return result.Items;
}

module.exports = {
    addDataSource,
    updateDataSource,
    removeDataSource,
    getDataSourceById,
    getDataSourcesByWorkspaceId,
    updateDataSourceStatus
}