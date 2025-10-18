// Author(s): Rhys Cleary

const { archiveExpiredAuditLogs } = require("./archiveService");

exports.handler = async () => {
    try {
        const result = await archiveExpiredAuditLogs();
    } catch (error) {
        console.error("An error occured archiving audit logs:", error)
    }
};