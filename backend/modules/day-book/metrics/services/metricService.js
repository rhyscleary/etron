// Author(s): Rhys Cleary

const metricRepo = require("@etron/day-book-shared/repositories/metricRepository");
const dataSourceRepo = require("@etron/day-book-shared/repositories/dataSourceRepository");
const { isOwner, isManager } = require("@etron/shared/utils/permissions");
const {v4 : uuidv4} = require('uuid');

async function createMetricInWorkspace(authUserId, workspaceId, payload) {

    const { name, dataSourceId, config } = payload;

    const metricId = uuidv4();
    const date = new Date().toISOString();

    // create metric item and store in repo 
    const metricItem = {
        workspaceId: workspaceId,
        metricId: metricId,
        dataSourceId: dataSourceId,
        name: name,
        config: config,
        createdAt: date,
        createdBy: authUserId,
        updatedAt: date
    };

    await metricRepo.addMetric(metricItem);

    // add metricId to the associated data source
    await dataSourceRepo.addMetricToDataSource(workspaceId, dataSourceId, metricId);

    return metricItem;
}

async function updateMetricInWorkspace(authUserId, workspaceId, metricId, payload) {

    const metric = await metricRepo.getMetricById(workspaceId, metricId);

    if (!metric) {
        throw new Error("The metric does not exist");
    }

    const { name, dataSourceId, config } = payload;
    
    // create metric item and store in repo 
    const metricItem = {
        name: name,
        dataSourceId: dataSourceId,
        config: config
    };

    return metricRepo.updateMetric(workspaceId, metricId, metricItem);
}

async function getMetricInWorkspace(authUserId, workspaceId, metricId) {

    const metric = await metricRepo.getMetricById(workspaceId, metricId);

    if (!metric) {
        return null;
    }

    return metric;
}

async function getMetricsInWorkspace(authUserId, workspaceId) {

    // get metrics by workspace id
    return metricRepo.getMetricsByWorkspaceId(workspaceId);
}

async function deleteMetricInWorkspace(authUserId, workspaceId, metricId) {

    // get metric
    const metric = await metricRepo.getMetricById(workspaceId, metricId);

    if (!metric) {
        throw new Error("Metric not found");
    }

    // remove the metric from the associated data source
    await dataSourceRepo.removeMetricFromDataSource(workspaceId, metric.dataSourceId, metric.metricId);


    // remove metric from repo
    await metricRepo.removeMetric(workspaceId, metricId);

    return {message: "Metric successfully deleted"};
}

module.exports = {
    createMetricInWorkspace,
    updateMetricInWorkspace,
    getMetricInWorkspace,
    getMetricsInWorkspace,
    deleteMetricInWorkspace
};
