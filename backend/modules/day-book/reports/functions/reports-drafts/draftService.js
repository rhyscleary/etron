// Author(s): Rhys Cleary

const dataSourceRepo = require("../repositories/dataSourceRepository");
const dataSourceSecretsRepo = require("../repositories/dataSourceSecretsRepository");
const workspaceRepo = require("@etron/shared/repositories/workspaceRepository");
const {v4 : uuidv4} = require('uuid');
const adapterFactory = require("../adapters/adapterFactory");
const { saveStoredData, removeAllStoredData, getUploadUrl } = require("../repositories/dataBucketRepository");
const { validateFormat } = require("../utils/validateFormat");
const { translateData } = require("../utils/translateData");
const { toParquet } = require("../utils/typeConversion");
const { getDownloadUrl } = require("../../../data-sources/repositories/dataBucketRepository");

async function createDraftReport(authUserId, workspaceId, payload) {

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

    await reportRepo.addDraft(draftItem);
    const uploadUrl = await getUploadUrl(workspaceId, draftId);

    return {
        ...draftItem,
        uploadUrl
    };
}

async function updateDraftReport(authUserId, workspaceId, draftId, payload) {

    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) {
        throw new Error("Draft not found");
    }

    const { name, newThumbnail } = payload;
    const currentDate = new Date().toISOString();

    if (editedBy && !Array.isArray(editedBy)) {
        throw new Error("Edited by must be an array of userIds");
    }




    // create draft item and update repo
    const draftUpdateItem = {
        name,
        editedBy,
        lastEdited: currentDate,
    };

    const updatedDraft = await reportRepo.updateDraft(workspaceId, draftId, draftUpdateItem);

    return updatedDraft;
}

async function getDraftReport(authUserId, workspaceId, draftId) {

    const draft = await reportRepo.getDraftById(workspaceId, draftId);

    if (!draft) {
        return null;
    }

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
    const draft = await reportRepo.getReportById(workspaceId, draftId);

    if (!draft) {
        throw new Error("Draft not found");
    }

    if (draft.fileKey) {
        await deleteObjectFromS3Workspace(draft.fileKey);
    }

    if (draft.thumbnailKey) {
        await deleteObjectFromS3Workspace(draft.thumbnailKey);
    }

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