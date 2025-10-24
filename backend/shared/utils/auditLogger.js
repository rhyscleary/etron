// Author(s): Rhys Cleary

const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient();

async function logAuditEvent(auditEvent) {
  if (!process.env.AUDIT_QUEUE_URL) {
    console.warn("AUDIT_QUEUE_URL not configured. Skipping audit log.");
    return;
  }

  try {
    const command = new SendMessageCommand({
        QueueUrl: process.env.AUDIT_QUEUE_URL,
        MessageBody: JSON.stringify(auditEvent),
      });

      await sqsClient.send(command);
    console.log("Sent audit event to SQS");
  } catch (error) {
    console.error("Failed to send audit event:", error);
  }
}

module.exports = { logAuditEvent };