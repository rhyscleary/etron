// Author(s): Rhys Cleary

const reportRepo = require("@etron/reports-shared/repositories/reportsRepository");
const {v4 : uuidv4} = require('uuid');
const { deleteFolder, getUploadUrl, getDownloadUrl } = require("@etron/reports-shared/repositories/reportsBucketRepository");
const { validateWorkspaceId } = require("@etron/shared/utils/validation");
const { hasPermission } = require("@etron/shared/utils/permissions");
const { logAuditEvent } = require("@etron/shared/utils/auditLogger");

// Permissions for this service
const PERMISSIONS = {
    VIEW_REPORTS: "modules.daybook.reports.view_reports",
    MANAGE_DRAFTS: "modules.daybook.reports.manage_drafts",
};

async function createDraftReport(authUserId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_DRAFTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const { name } = payload;

    if (!name || typeof name !== "string") {
        throw new Error("No name for the draft");
    }

    const draftId = uuidv4();
    const currentDate = new Date().toISOString();

    // create data source item and store in repo 
    const draftItem = {
        workspaceId,
        draftId,
        name,
        createdBy: authUserId,
        editedBy: [authUserId],
        createdAt: currentDate,
        lastEdited: currentDate
    };

    const fileKey = `workspaces/${workspaceId}/day-book/reports/drafts/${draftId}/report.html`;
    const thumbnailKey = `workspaces/${workspaceId}/day-book/reports/drafts/${draftId}/thumbnail.jpeg`;

    draftItem.fileKey = fileKey;
    draftItem.thumbnailKey = thumbnailKey;

    const fileUploadUrl = await getUploadUrl(fileKey, { 
        ContentType: "text/html"
    });

    const thumbnailUrl = await getUploadUrl(thumbnailKey, {
        ContentType: "image/jpeg"
    });

    await reportRepo.addDraft(draftItem);

    // log audit
    await logAuditEvent({
        workspaceId,
        userId: authUserId,
        action: "Created",
        filters: ["modules", "created"],
        module: "daybook",
        itemType: "report",
        itemId: draftId,
        itemName: name
    });

    return {
        ...draftItem,
        fileUploadUrl,
        thumbnailUrl
    };
}

async function updateDraftReport(authUserId, draftId, payload) {
    const workspaceId = payload.workspaceId;
    await validateWorkspaceId(workspaceId);

    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_DRAFTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) throw new Error("Draft not found");

    const { name, isThumbnailUpdated, isFileUpdated } = payload;
    const currentDate = new Date().toISOString();

    // ensure only unique users are added to editedBy
    const editedBySet = new Set([...(draft.editedBy || []), authUserId]);

    // create draft item and update repo
    const draftUpdateItem = {
        lastEdited: currentDate,
        editedBy: Array.from(editedBySet),
    };

    let fileUploadUrl = null;
    let thumbnailUploadUrl = null;

    if (name) {
        draftUpdateItem.name = name;
    }

    if (isFileUpdated) {
        fileUploadUrl = await getUploadUrl(draft.fileKey, {
            ContentType: "text/html"
        });
    }

    if (isThumbnailUpdated) {
        thumbnailUploadUrl = await getUploadUrl(draft.thumbnailKey, {
            ContentType: `image/jpeg`
        });
    }

    const updatedDraft = await reportRepo.updateDraft(workspaceId, draftId, draftUpdateItem);

    const fileUrl = draft.fileKey ? await getDownloadUrl(draft.fileKey) : null;
    const thumbnailUrl = draft.fileKey ? await getDownloadUrl(draft.thumbnailKey) : null;

    // log audit
    await logAuditEvent({
        workspaceId,
        userId: authUserId,
        action: "Updated",
        filters: ["modules", "updated"],
        module: "daybook",
        itemType: "report",
        itemId: draftId,
        itemName: updatedDraft.name
    });
    
    return {
        ...updatedDraft,
        fileUrl,
        thumbnailUrl,
        fileUploadUrl,
        thumbnailUploadUrl
    }
}

async function getDraftReport(authUserId, workspaceId, draftId) {
    await validateWorkspaceId(workspaceId);
    
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_REPORTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) return null;

    const fileUrl = draft.fileKey 
        ? await getDownloadUrl(draft.fileKey)
        : null;

    const thumbnailUrl = draft.thumbnailKey
        ? await getDownloadUrl(draft.thumbnailKey)
        : null;

    return {
        ...draft,
        fileUrl,
        thumbnailUrl
    };
}

async function getDraftReports(authUserId, workspaceId) {
    await validateWorkspaceId(workspaceId);
    
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.VIEW_REPORTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // get all drafts in a workspace
    const drafts = await reportRepo.getDraftsByWorkspaceId(workspaceId);

    if (!drafts || drafts.length === 0) return [];

    const results = await Promise.all(
        drafts.map(async draft => {
            const fileUrl = draft.fileKey
                ? await getDownloadUrl(draft.fileKey)
                : null;

            const thumbnailUrl = draft.thumbnailKey
                ? await getDownloadUrl(draft.thumbnailKey)
                : null;

            return {
                ...draft,
                fileUrl,
                thumbnailUrl
            };
        })
    );

    return results;
}

async function deleteDraftReport(authUserId, workspaceId, draftId) {
    await validateWorkspaceId(workspaceId);
    
    const isAuthorised = await hasPermission(authUserId, workspaceId, PERMISSIONS.MANAGE_DRAFTS);

    if (!isAuthorised) {
        throw new Error("User does not have permission to perform action");
    }

    // get draft details
    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) throw new Error("Draft not found");

    const folderPrefix = `workspaces/${workspaceId}/day-book/reports/drafts/${draftId}/`;
    await deleteFolder(folderPrefix);

    await reportRepo.deleteDraft(workspaceId, draftId);

    // log audit
    await logAuditEvent({
        workspaceId,
        userId: authUserId,
        action: "Deleted",
        filters: ["modules", "deleted"],
        module: "daybook",
        itemType: "report",
        itemId: draftId,
        itemName: draft.name
    });

    return {message: "Draft successfully deleted"};
}

module.exports = {
    createDraftReport,
    updateDraftReport,
    getDraftReport,
    getDraftReports,
    deleteDraftReport
};