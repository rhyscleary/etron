// Author(s): Rhys Cleary

const reportRepo = require("@etron/reports-shared/repositories/reportsRepository");
const {v4 : uuidv4} = require('uuid');
const { getUploadUrl, getDownloadUrl } = require("@etron/reports-shared/repositories/reportsBucketRepository");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");

async function addExportedReport(authUserId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const { name, draftId, fileType } = payload;

    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) {
        throw new Error("Export does not exist");
    }

    if (!name || typeof name !== "string") {
        throw new Error("There is no name specified for the draft");
    }

    const exportId = uuidv4();
    const currentDate = new Date().toISOString();

    // create export item and store in repo 
    const exportItem = {
        workspaceId,
        exportId,
        name,
        draftId,
        fileType,
        exportedBy: authUserId,
        createdAt: currentDate,
    };

    const fileKey = `workspaces/${workspaceId}/day-book/reports/drafts/${draftId}/report.html`;

    exportItem.fileKey = fileKey;

    const fileUploadUrl = await getUploadUrl(fileKey, { 
        ContentType: "text/html"
    });

    await reportRepo.addExport(exportItem);

    return {
        ...exportItem,
        fileUploadUrl
    };
}

async function getExportedReport(authUserId, workspaceId, exportId) {
    await validateWorkspaceId(workspaceId);
    const reportExport = await reportRepo.getExportById(workspaceId, exportId);

    if (!reportExport) return null;

    return reportExport;
}

async function getExportedReports(authUserId, workspaceId) {
    await validateWorkspaceId(workspaceId);

    // get all report exports in a workspace
    const reportExports = await reportRepo.getExportsByWorkspaceId(workspaceId);

    if (!reportExports || reportExports.length === 0) return [];

    return reportExports;
}

async function getExportDownloadUrl(authUserId, workspaceId, exportId) {
    await validateWorkspaceId(workspaceId);

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