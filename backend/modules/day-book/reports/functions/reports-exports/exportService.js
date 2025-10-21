// Author(s): Rhys Cleary

const reportRepo = require("@etron/reports-shared/repositories/reportsRepository");
const {v4 : uuidv4} = require('uuid');
const { getUploadUrl, getDownloadUrl } = require("@etron/reports-shared/repositories/reportsBucketRepository");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const { getFileConfig } = require("@etron/reports-shared/utils/exportTypes");
const { hasPermission } = require("@etron/shared/utils/permissions");

// Permissions for this service
const PERMISSIONS = {
    VIEW_EXPORTS: "modules.daybook.reports.view_exports",
    MANAGE_EXPORTS: "modules.daybook.reports.manage_exports",
};

async function addExportedReport(authUserId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_EXPORTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const { name, draftId, fileType } = payload;

    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) {
        throw new Error("Draft does not exist");
    }

    if (!name || typeof name !== "string") {
        throw new Error("No name for this export");
    }

    const fileConfig = getFileConfig(fileType);
    if (!fileConfig.valid) {
        throw new Error(fileConfig.error);
    }

    const exportId = uuidv4();
    const currentDate = new Date().toISOString();

    // create export item and store in repo 
    const exportItem = {
        workspaceId,
        exportId,
        name,
        draftId,
        fileType: fileConfig.extension,
        exportedBy: authUserId,
        createdAt: currentDate,
    };

    const fileKey = `workspaces/${workspaceId}/day-book/reports/exports/${exportId}/${name}.${fileConfig.extension}`;

    exportItem.fileKey = fileKey;

    const fileUploadUrl = await getUploadUrl(fileKey, { 
        ContentType: fileConfig.contentType
    });

    await reportRepo.addExport(exportItem);

    return {
        ...exportItem,
        fileUploadUrl
    };
}

async function getExportedReport(authUserId, workspaceId, exportId) {
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_EXPORTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const reportExport = await reportRepo.getExportById(workspaceId, exportId);

    if (!reportExport) return null;

    return reportExport;
}

async function getExportedReports(authUserId, workspaceId) {
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_EXPORTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // get all report exports in a workspace
    const reportExports = await reportRepo.getExportsByWorkspaceId(workspaceId);

    if (!reportExports || reportExports.length === 0) return [];

    return reportExports;
}

async function getExportDownloadUrl(authUserId, workspaceId, exportId) {
    await validateWorkspaceId(workspaceId);
    
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_EXPORTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const reportExport = await reportRepo.getExportById(workspaceId, exportId);

    if (!reportExport) {
        throw new Error("Export does not exist");
    }

    const fileUrl = reportExport.fileKey 
        ? await getDownloadUrl(reportExport.fileKey)
        : null;

    return {
        fileUrl
    }
}

module.exports = {
    addExportedReport,
    getExportedReport,
    getExportedReports,
    getExportDownloadUrl,
};