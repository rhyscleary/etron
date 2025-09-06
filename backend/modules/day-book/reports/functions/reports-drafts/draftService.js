// Author(s): Rhys Cleary

const reportRepo = require("@etron/reports-shared/repositories/reportsRepository");
const {v4 : uuidv4} = require('uuid');
const { deleteFolder, getUploadUrl, getDownloadUrl } = require("@etron/reports-shared/repositories/reportsBucketRepository");

async function createDraftReport(authUserId, payload) {
    const workspaceId = payload.workspaceId;

    const { name } = payload;

    if (!name || typeof name !== "string") {
        throw new Error("There is no name specified for the draft");
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

    const fileKey = `workspaces/${workspaceId}/day-book/reports/drafts/${draftId}/report.docx`;
    const thumbnailKey = `workspaces/${workspaceId}/day-book/reports/drafts/${draftId}/thumbnail.jpeg`;

    draftItem.fileKey = fileKey;
    draftItem.thumbnailKey = thumbnailKey;

    const fileUploadUrl = await getUploadUrl(fileKey, { 
        ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const thumbnailUrl = await getUploadUrl(thumbnailKey, {
        ContentType: "image/jpeg"
    });

    await reportRepo.addDraft(draftItem);

    return {
        ...draftItem,
        fileUploadUrl,
        thumbnailUrl
    };
}

async function updateDraftReport(authUserId, draftId, payload) {
    const workspaceId = payload.workspaceId;

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
            ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
    
    return {
        ...updatedDraft,
        fileUrl,
        thumbnailUrl,
        fileUploadUrl,
        thumbnailUploadUrl
    }
}

async function getDraftReport(authUserId, workspaceId, draftId) {
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

    // get draft details
    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) throw new Error("Draft not found");

    const folderPrefix = `workspaces/${workspaceId}/day-book/reports/drafts/${draftId}/`;
    await deleteFolder(folderPrefix);

    await reportRepo.deleteDraft(workspaceId, draftId);

    return {message: "Draft successfully deleted"};
}

module.exports = {
    createDraftReport,
    updateDraftReport,
    getDraftReport,
    getDraftReports,
    deleteDraftReport
};