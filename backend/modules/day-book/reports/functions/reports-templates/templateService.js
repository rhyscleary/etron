// Author(s): Rhys Cleary

const reportRepo = require("@etron/reports-shared/repositories/reportsRepository");
const {v4 : uuidv4} = require('uuid');
const { deleteFolder, getUploadUrl, getDownloadUrl } = require("@etron/reports-shared/repositories/reportsBucketRepository");

async function createTemplateReport(authUserId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

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

    const fileKey = `workspaces/${workspaceId}/day-book/reports/templates/${templateId}/report.html`;
    const thumbnailKey = `workspaces/${workspaceId}/day-book/reports/templates/${templateId}/thumbnail.jpeg`;

    templateItem.fileKey = fileKey;
    templateItem.thumbnailKey = thumbnailKey;

    const fileUploadUrl = await getUploadUrl(fileKey, { 
        ContentType: "text/html"
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
    await validateWorkspaceId(workspaceId);

    const template = await reportRepo.getTemplateById(workspaceId, templateId);

    if (!template) throw new Error("Template not found");

    const { name, isThumbnailUpdated, isFileUpdated } = payload;
    const currentDate = new Date().toISOString();

    // ensure only unique users are added to editedBy
    const editedBySet = new Set([...(template.editedBy || []), authUserId]);

    // create template item and update repo
    const templateUpdateItem = {
        lastEdited: currentDate,
        editedBy: Array.from(editedBySet),
    };

    let fileUploadUrl = null;
    let thumbnailUploadUrl = null;

    if (name) {
        templateUpdateItem.name = name;
    }

    if (isFileUpdated) {
        fileUploadUrl = await getUploadUrl(template.fileKey, {
            ContentType: "text/html"
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
    await validateWorkspaceId(workspaceId);
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
    await validateWorkspaceId(workspaceId);

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
    await validateWorkspaceId(workspaceId);

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