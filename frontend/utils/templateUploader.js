// Authors: Matthew Page

import { Alert } from "react-native";
import RNFS from "react-native-fs";
import { apiPatch, apiPost } from "./api/apiClient";
import endpoints from "./api/endpoints";
import axios from "axios";

/**
 * Uploads a file to S3 using a pre-signed URL
 */
async function uploadTemplateToS3(filePath, fileUploadUrl) {
    try {
        const fileBlob = await RNFS.readFile(filePath, "utf8");
        const response = await axios.put(fileUploadUrl, fileBlob, {
            headers: {
                "Content-Type": "text/html",
            },
        });

        if (response.status >= 200 && response.status < 300) {
            console.log("File uploaded successfully to S3 (Template)");
            return true;
        } else {
            console.error(`Upload to S3 failed with response status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error("Failed to upload template file:", error);
        return false;
    }
}

/**
 * Update an existing template
 */
export async function uploadUpdatedTemplate({
    workspaceId,
    templateId,
    templateName,
    editorContent,
}) {
    if (!workspaceId || !templateId) {
        Alert.alert("Error", "Missing workspace or template Id.");
        console.log("Workspace Id or template Id missing");
        return;
    }

    const trimmedFileName = templateName.trim() || "Template";
    const filePath = `${RNFS.CachesDirectoryPath}/${trimmedFileName}.html`;

    // write editor content to local file store
    try {
        await RNFS.writeFile(filePath, editorContent || "<p>No content</p>", "utf8");
        console.log("Local HTML file written at:", filePath);
    } catch (error) {
        console.error("Failed to write local file:", error);
        Alert.alert("Error", "Could not save local file");
        return;
    }

    let fileUploadUrl;
    try {
        // 🔑 endpoint for updating a template
        const updateResult = await apiPatch(
            endpoints.modules.day_book.reports.templates.updateTemplate(templateId),
            {
                workspaceId,
                name: trimmedFileName,
                isFileUpdated: true,
            }
        );

        console.log("Update template result:", updateResult.data);

        fileUploadUrl = updateResult.data.fileUploadUrl;

        if (!fileUploadUrl) {
            console.error("No fileUploadUrl returned from the API (Template)");
            return;
        }
    } catch (error) {
        console.error("Failed to get template upload URL:", error.response || error);
        Alert.alert("Error", "Could not get upload URL from server");
        return;
    }

    return uploadTemplateToS3(filePath, fileUploadUrl);
}

/**
 * Create a new template
 */
export async function createNewTemplate({
    workspaceId,
    templateName,
}) {
    if (!workspaceId) {
        Alert.alert("Error", "Missing workspace Id.");
        console.log("Workspace Id missing");
        return;
    }

    const trimmedFileName = templateName.trim() || "Template";
    const filePath = `${RNFS.CachesDirectoryPath}/${trimmedFileName}.html`;

    // write empty editor content to local file store
    try {
        await RNFS.writeFile(filePath, "<p></p>", "utf8");
        console.log("Local HTML file written at:", filePath);
    } catch (error) {
        console.error("Failed to write local file:", error);
        Alert.alert("Error", "Could not save local file");
        return;
    }

    let fileUploadUrl, newTemplateId;
    try {
        // 🔑 endpoint for creating a template
        const createResult = await apiPost(
            endpoints.modules.day_book.reports.templates.createTemplate,
            {
                workspaceId,
                name: trimmedFileName,
            }
        );

        console.log("Create template result:", createResult);

        fileUploadUrl = createResult.data.fileUploadUrl;
        newTemplateId = createResult.data.templateId;

        if (!fileUploadUrl || !newTemplateId) {
            console.error("Invalid create template response");
            return;
        }
    } catch (error) {
        console.error("Failed to create new template:", error.response || error);
        Alert.alert("Error", "Could not create new template");
        return;
    }

    const uploaded = await uploadTemplateToS3(filePath, fileUploadUrl);

    return uploaded ? newTemplateId : null;
}
