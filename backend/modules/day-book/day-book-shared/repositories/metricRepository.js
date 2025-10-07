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

const tableName = "Metrics";

// add metric
async function addMetric(metricItem) {
    await dynamoDB.send(
        new PutCommand( {
            TableName: tableName,
            Item: metricItem
        })
    );
}

// update metric
async function updateMetric(workspaceId, metricId, metricItem) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (metricItem.name !== undefined) {
        updateFields.push("#name = :name");
        expressionAttributeValues[":name"] = metricItem.name;
        expressionAttributeNames["#name"] = "name";
    }

    if (metricItem.dataSourceId !== undefined) {
        updateFields.push("#dataSourceId = :dataSourceId");
        expressionAttributeValues[":dataSourceId"] = metricItem.dataSourceId;
        expressionAttributeNames["#dataSourceId"] = "dataSourceId";
    }

    if (metricItem.config !== undefined) {
        updateFields.push("#config = :config");
        expressionAttributeValues[":config"] = metricItem.config;
        expressionAttributeNames["#config"] = "config";
    }

    updateFields.push("#updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    const result = await dynamoDB.send(
        new UpdateCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                metricId: metricId
            },
            UpdateExpression: "SET " + updateFields.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "ALL_NEW"
        })
    );

    return result;
}

// remove metric
async function removeMetric(workspaceId, metricId) {
    await dynamoDB.send(
        new DeleteCommand( {
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                metricId: metricId
            },
        })
    );
}

// get metric by id
async function getMetricById(workspaceId, metricId) {
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: tableName,
            Key: {
                workspaceId: workspaceId,
                metricId: metricId
            }
        })
    );
    
    return result.Item;
}

// get the variables of a metric
async function getMetricVariableNames(workspaceId, metricId) {
    const result = await getMetricById(workspaceId, metricId);
    const variables = [
        ...result.config.dependentVariables,
        result.config.independentVariable
    ];
    return variables;
}

// get metrics by workspaceId
async function getMetricsByWorkspaceId(workspaceId) {
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
    addMetric,
    updateMetric,
    removeMetric,
    getMetricById,
    getMetricVariableNames,
    getMetricsByWorkspaceId
}