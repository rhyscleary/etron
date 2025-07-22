// Author(s): Rhys Cleary

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const getInvite = require("../invites/getInvite");
const { getUserByEmail } = require("../utils/auth");
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient());

async function addDataSource(authUserId, data) {

}

async function updateDataSource(authUserId, dataSourceId, data) {

}

async function getDataSourceById(authUserId, dataSourceId) {

}

async function getDataSources(authUserId) {

}

async function removeDataSource(authUserId, dataSourceId) {

}

module.exports = {
    addDataSource,
    updateDataSource,
    getDataSourceById,
    getDataSources,
    removeDataSource
};