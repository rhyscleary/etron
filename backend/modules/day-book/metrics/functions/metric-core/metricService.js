// Author(s): Rhys Cleary

const metricRepo = require("@etron/day-book-shared/repositories/metricRepository");
const dataSourceRepo = require("@etron/day-book-shared/repositories/dataSourceRepository");
const { getUploadUrl, getDownloadUrl } = require("@etron/metrics-shared/repositories/metricsBucketRepository");
const { hasPermission } = require("@etron/shared/utils/permissions");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const {v4 : uuidv4} = require('uuid');
const { hasPermission } = require("@etron/shared/utils/permissions");

// Permissions for this service
const PERMISSIONS = {
    VIEW_METRICS: "modules.daybook.metrics.view_metrics",
    MANAGE_METRICS: "modules.daybook.metrics.manage_metrics",
};

async function createMetricInWorkspace(authUserId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_METRICS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

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

    const thumbnailKey = `workspaces/${workspaceId}/day-book/metrics/${metricId}/thumbnail.jpeg`;

    metricItem.thumbnailKey = thumbnailKey;

    const thumbnailUrl = await getUploadUrl(thumbnailKey, {
        ContentType: "image/jpeg"
    });

    await metricRepo.addMetric(metricItem);

    // add metricId to the associated data source
    await dataSourceRepo.addMetricToDataSource(workspaceId, dataSourceId, metricId);

    return {
        ...metricItem,
        thumbnailUrl
    };
}

async function updateMetricInWorkspace(authUserId, metricId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_METRICS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

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

    const thumbnailUploadUrl = await getUploadUrl(metric.thumbnailKey, {
        ContentType: "image/jpeg"
    });

    const updatedMetric = metricRepo.updateMetric(workspaceId, metricId, metricItem);

    const thumbnailUrl = await getDownloadUrl(metric.thumbnailKey);

    return {
        ...updatedMetric,
        thumbnailUrl,
        thumbnailUploadUrl
    }
}

async function getMetricInWorkspace(authUserId, workspaceId, metricId) {
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_METRICS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const metric = await metricRepo.getMetricById(workspaceId, metricId);

    if (!metric) {
        return null;
    }

    return metric;
}

async function getMetricsInWorkspace(authUserId, workspaceId) {
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_METRICS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // get metrics by workspace id
    return metricRepo.getMetricsByWorkspaceId(workspaceId);
}

async function deleteMetricInWorkspace(authUserId, workspaceId, metricId) {
    await validateWorkspaceId(workspaceId);
    
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_METRICS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

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
