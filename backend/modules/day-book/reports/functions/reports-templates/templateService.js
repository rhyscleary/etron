// Author(s): Rhys Cleary

const reportRepo = require("../../reports-shared/repositories/reportsRepository");
const {v4 : uuidv4} = require('uuid');
const { deleteFolder, getUploadUrl, getDownloadUrl } = require("../../reports-shared/repositories/reportsBucketRepository");

async function createTemplateReport(authUserId, payload) {
    const workspaceId = payload.workspaceId;

    const { name } = payload;

    if (!name || typeof name !== "string") {
        throw new Error("There is no name specified for the template");
    }

    const templateId = uuidv4();
    const currentDate = new Date().toISOString();

    // create data source item and store in repo 
    const templateItem = {
        workspaceId,
        templateId,
        name,
        createdBy: authUserId,
        editedBy: [authUserId],
        createdAt: currentDate,
        lastEdited: currentDate
    };

    const fileKey = `workspaces/${workspaceId}/day-book/reports/templates/${templateId}/report.docx`;
    const thumbnailKey = `workspaces/${workspaceId}/day-book/reports/templates/${templateId}/thumbnail.jpeg`;

    templateItem.fileKey = fileKey;
    templateItem.thumbnailKey = thumbnailKey;

    const fileUploadUrl = await getUploadUrl(fileKey, { 
        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const thumbnailUrl = await getUploadUrl(thumbnailKey, {
        ContentType: "image/jpeg"
    });

    await reportRepo.addTemplate(templateItem);

    return {
        ...templateItem,
        fileUploadUrl,
        thumbnailUrl
    };
}

async function updateTemplateReport(authUserId, templateId, payload) {
    const workspaceId = payload.workspaceId;

    const template = await reportRepo.getTemplateById(workspaceId, templateId);

    if (!template) throw new Error("Template not found");

    const { name, isThumbnailUpdated, isFileUpdated } = payload;
    const currentDate = new Date().toISOString();

    // create template item and update repo
    const templateUpdateItem = {
        lastEdited: currentDate,
        editedBy: [...(template.editedBy || []), authUserId],
    };

    let fileUploadUrl = null;
    let thumbnailUploadUrl = null;

    if (name) {
        templateUpdateItem.name = name;
    }

    if (isFileUpdated) {
        fileUploadUrl = await getUploadUrl(template.fileKey, {
            ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
    }

    if (isThumbnailUpdated) {
        thumbnailUploadUrl = await getUploadUrl(template.thumbnailKey, {
            ContentType: `image/jpeg`
        });
    }

    const updatedTemplate = await reportRepo.updateTemplate(workspaceId, templateId, templateUpdateItem);

    const fileUrl = template.fileKey ? await getDownloadUrl(template.fileKey) : null;
    const thumbnailUrl = template.fileKey ? await getDownloadUrl(template.thumbnailKey) : null;
    
    return {
        ...updatedTemplate,
        fileUrl,
        thumbnailUrl,
        fileUploadUrl,
        thumbnailUploadUrl
    }
}

async function getTemplateReport(authUserId, workspaceId, templateId) {
    const template = await reportRepo.getTemplateById(workspaceId, templateId);

    if (!template) return null;

    const fileUrl = template.fileKey 
        ? await getDownloadUrl(template.fileKey)
        : null;

    const thumbnailUrl = template.thumbnailKey
        ? await getDownloadUrl(template.thumbnailKey)
        : null;

    return {
        ...template,
        fileUrl,
        thumbnailUrl
    };
}

async function getTemplateReports(authUserId, workspaceId) {

    // get all templates in a workspace
    const templates = await reportRepo.getTemplatesByWorkspaceId(workspaceId);

    if (!templates || templates.length === 0) return [];

    const results = await Promise.all(
        templates.map(async template => {
            const fileUrl = template.fileKey
                ? await getDownloadUrl(template.fileKey)
                : null;

            const thumbnailUrl = template.thumbnailKey
                ? await getDownloadUrl(template.thumbnailKey)
                : null;

            return {
                ...template,
                fileUrl,
                thumbnailUrl
            };
        })
    );

    return results;
}

async function deleteTemplateReport(authUserId, workspaceId, templateId) {

    // get template details
    const template = await reportRepo.getTemplateById(workspaceId, templateId);

    if (!template) throw new Error("Template not found");

    const folderPrefix = `workspaces/${workspaceId}/day-book/reports/templates/${templateId}/`;
    await deleteFolder(folderPrefix);

    await reportRepo.deleteTemplate(workspaceId, templateId);

    return {message: "Template successfully deleted"};
}

module.exports = {
    createTemplateReport,
    updateTemplateReport,
    getTemplateReport,
    getTemplateReports,
    deleteTemplateReport
};