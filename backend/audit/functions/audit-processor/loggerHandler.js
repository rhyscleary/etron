const { processAuditEventBatch } = require("./loggerService");

// handler evoked by SQS batch
exports.handler = async (event) => {
    console.log("Received SQS batch:", JSON.stringify(event, null, 2));

    try {
        const results = await processAuditEventBatch(event);
        console.log("Audit batch summary:", results);
    } catch (error) {
        console.error("Error processing SQS batch:", error);
    }
};