// Author(s): Rhys Cleary

const AWS = require("aws-sdk");
const sqs = new AWS.SQS();

async function logAuditEvent(auditEvent) {
  if (!process.env.AUDIT_QUEUE_URL) {
    console.warn("AUDIT_QUEUE_URL not configured. Skipping audit log.");
    return;
  }

  try {
    await sqs
      .sendMessage({
        QueueUrl: process.env.AUDIT_QUEUE_URL,
        MessageBody: JSON.stringify(auditEvent),
      })
      .promise();
    console.log("Sent audit event to SQS");
  } catch (error) {
    console.error("Failed to send audit event:", error);
  }
}

module.exports = { logAuditEvent };