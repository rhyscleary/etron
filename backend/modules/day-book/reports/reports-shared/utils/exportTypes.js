// decare values for different mime types
const mimeTypes = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    rtf: "application/rtf",
    odt: "application/vnd.oasis.opendocument.text"
};

function getFileConfig(fileType) {
    if (!fileType) {
        return { valid: false, error: "File type not specified" };
    }

    const normalisedType = fileType.toLowerCase();
    if (!mimeTypes[normalisedType]) {
        return { valid: false, error: `Unsupported file type: ${fileType}` };
    }

    return {
        valid: true,
        extension: normalisedType,
        contentType: mimeTypes[normalisedType]
    };
}

module.exports = {
    getFileConfig
};