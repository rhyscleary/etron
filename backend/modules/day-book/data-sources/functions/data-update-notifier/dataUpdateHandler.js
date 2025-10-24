// Author(s): Rhys Cleary

const dataSourceRepo = require("@etron/day-book-shared/repositories/dataSourceRepository");
const axios = require("axios");
const { S3Client, GetObjectCommand } = require("aws-sdk/client-s3");

const s3Client = new S3Client({});

exports.handler = async (event) => {
    let statusCode = 200;

    for (const record of event.Records) {
        if (record.eventName !== "ObjectCreated:Put") continue;
    

        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

        if (bucket !== process.env.WORKSPACE_BUCKET) continue;

        const components = key.split("/");
        const [workspaceSegment, workspaceId, , , dataSourceId] = components;

        if (workspaceSegment !== "workspaces" || !workspaceId || !dataSourceId) {
            console.warn("Unexpected S3 key or missing IDS:", key);
            continue;
        }

        let metrics = [];
        try {
            const dataSource = await dataSourceRepo.getDataSourceById(workspaceId, dataSourceId);
            metrics = dataSource.metrics;
        } catch (error) {
            continue; // skip if metrics can't be fetched
        }

        // skip if no metrics exist
        if (!metrics || metrics.length === 0) continue;

        // apsync mutation
        const mutation = `
            mutation NotifyDataUpdate(
                $workspaceId: ID!, 
                $dataSourceId: ID!, 
                $metrics: [ID!]
            ) {
                notifyDataUpdate(
                    workspaceId: $workspaceId, 
                    dataSourceId: $dataSourceId, 
                    metrics: $metrics
                ) {
                    workspaceId,
                    dataSourceId,
                    metrics
                }
            }
        `;

        const variables = {
            workspaceId,
            dataSourceId,
            metrics
        };

        try {
            await axios.post(
                process.env.APPSYNC_URL,
                { query: mutation, variables },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.APPSYNC_API_KEY
                    }
                }
            )
        } catch (error) {
            console.error("Unable to send mutation:", error.message);
        }
    }

    return {
        statusCode,
        body: JSON.stringify({message: "Processed event to AppSync successfully"}),
    };
};