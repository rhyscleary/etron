// Author(s): Rhys Cleary
const axios = require("axios");
const AWS = require("aws-sdk");

const s3 = new AWS.S3();

exports.handler = async (event) => {
    let statusCode = 200;
    let body;

    for (const record of event.Records) {
        if (record.eventName !== "ObjectCreated:Put") {
            continue;
        }
    

        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

        if (bucket !== "etron-day-book-sourced-data") {
            continue;
        }

        const s3KeyComponents = key.split("/");

        const workspaceId = s3KeyComponents[0];
        const dataSourceId = s3KeyComponents[1];

        if (!workspaceId || !dataSourceId) {
            console.warn("Missing workspace or dataSource Id");
            continue;
        }

        const mutation = `
            mutation NotifyMetricUpdate($workspaceId: ID!, $dataSourceId: ID!, $s3Key: String!) {
                notifyMetricUpdate(workspaceId: $workspaceId, dataSourceId: $dataSourceId, s3Key: $s3Key) {
                    workspaceId,
                    dataSourceId,
                    s3Key
                }
            }
        `;

        const variables = {
            workspaceId,
            dataSourceId,
            s3Key: key
        };

        try {
            const response = await axios.post(
                "https://5l5tqlgfjbevtgnio2xz5cikb4.appsync-api.ap-southeast-2.amazonaws.com/graphql",
                {
                    query: mutation,
                    variables
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": "da2-reywxwkbzzh4rkr2oyxvwdobeu"
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