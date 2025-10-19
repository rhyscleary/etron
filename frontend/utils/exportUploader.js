// Author(s): Matthew Page

import { Alert } from "react-native";
import RNFS from "react-native-fs";
import { apiPost } from "./api/apiClient";
import endpoints from "./api/endpoints";
import axios from "axios";

// MIME type lookup table for different export file types
const MIME_TYPES = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    odt: "application/vnd.oasis.opendocument.text",
    rtf: "application/rtf",
};

// Generates simple placeholder content depending on file type
function getPlaceholderContent(fileType) {
    switch (fileType) {
        case "docx":
            return "PK\u0003\u0004"; // minimal DOCX ZIP signature (placeholder)
        case "odt":
            return "PK\u0003\u0004"; // minimal ODT ZIP signature
        case "rtf":
            return "{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Courier;}}\n\\f0\\fs20 Export File\n}";
        case "pdf":
        default:
            return "%PDF-1.4\n%EOF"; // minimal valid PDF header/footer
    }
}

// Uploads a file to an S3 pre-signed URL
async function uploadExportToS3(filePath, fileUploadUrl, fileType) {
    console.log("=== EXPORT UPLOADER START ===");
    console.log("File Path:", filePath);
    console.log("Upload URL:", fileUploadUrl ? "[RECEIVED]" : "[MISSING]");
    console.log("File Type:", fileType);

    try {
        // Read file as binary buffer instead of utf8 (avoids encoding issues)
        const fileData = await RNFS.readFile(filePath, "base64");
        const mimeType = MIME_TYPES[fileType] || "application/octet-stream";

        // Convert base64 string to raw binary buffer
        const binaryData = Buffer.from(fileData, "base64");

        const response = await axios.put(fileUploadUrl, binaryData, {
            headers: { "Content-Type": mimeType },
        });

        if (response.status >= 200 && response.status < 300) {
            console.log("File uploaded successfully to S3.");
            console.log("=== EXPORT UPLOADER END ===");
            return true;
        } else {
            console.log("Upload failed with status:", response.status);
            console.log("=== EXPORT UPLOADER END ===");
            return false;
        }
    } catch (error) {
        console.log("Export upload error:", error.message);
        Alert.alert("Upload Error", "Failed to upload export file to S3.");
        console.log("=== EXPORT UPLOADER END ===");
        return false;
    }
}

// Creates a new export file (pdf, docx, odt, rtf), writes locally, requests upload URL, and uploads to S3
export async function uploadExportFile({
    workspaceId,
    exportName,
    draftId,
    fileType = "pdf",
    filePath,
}) {
    console.log("=== CREATE NEW EXPORT START ===");

    if (!workspaceId || !draftId || !filePath) {
        console.log("Error: Missing workspaceId or draftId.");
        Alert.alert("Error", "Missing workspaceId or draftId.");
        console.log("=== CREATE NEW EXPORT END ===");
        return;
    }

    /*const trimmedFileName = exportName?.trim() || "Untitled Export";
    const extension = fileType.toLowerCase();
    const filePath = `${RNFS.CachesDirectoryPath}/${trimmedFileName}.${extension}`;
    const contentToWrite = fileContent || getPlaceholderContent(extension);
    const encoding = fileContent ? "base64" : "ascii";

    try {
        // Write placeholder or provided content to file
        await RNFS.writeFile(filePath, contentToWrite, encoding);
        console.log(`Local ${extension.toUpperCase()} export file written at: ${filePath}`);
    } catch (error) {
        console.log("File write error:", error.message);
        Alert.alert("Error", "Could not save export file locally.");
        console.log("=== CREATE NEW EXPORT END ===");
        return;
    }*/

    let fileUploadUrl, newExportId;
    try {
        console.log("Requesting new export creation from server...");
        const createResult = await apiPost(
            endpoints.modules.day_book.reports.exports.addExport,
            {
                workspaceId,
                name: exportName,
                draftId,
                fileType,
            }
        );

        fileUploadUrl = createResult.data?.fileUploadUrl;
        newExportId = createResult.data?.exportId;

        if (!fileUploadUrl || !newExportId) {
            console.log("Invalid server response: Missing fileUploadUrl or exportId.");
            console.log("=== CREATE NEW EXPORT END ===");
            return;
        }

        console.log("Server returned valid export creation data.");
    } catch (error) {
        console.log("Export creation request error:", error.message);
        Alert.alert("Error", "Could not create export on the server.");
        console.log("=== CREATE NEW EXPORT END ===");
        return;
    }

    /*const uploaded = await uploadExportToS3(filePath, fileUploadUrl, extension);

    if (uploaded) {
        console.log(`Export ${newExportId} (${extension.toUpperCase()}) uploaded successfully.`);
    } else {
        console.log("Export upload failed.");
    }*/

    try {
        const fileData = await RNFS.readFile(filePath, "base64");
        const mimeType = "application/pdf";

        const binaryData = Buffer.from(fileData, "base64");
        const response = await axios.put(fileUploadUrl, binaryData, {
            headers: { "Content-Type": mimeType },
        });

        if (response.status >= 200 && response.status < 300) {
            console.log(`Export ${newExportId} uploaded successfully.`);
            return newExportId;
        } else {
            console.error("Upload failed:", response.status);
            return null;
        }
    } catch (err) {
        console.error("Error uploading PDF:", err);
        return null;
    }

    //console.log("=== CREATE NEW EXPORT END ===");
    //return uploaded ? newExportId : null;
}