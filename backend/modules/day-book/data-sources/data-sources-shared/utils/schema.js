// Author(s): Rhys Cleary
const {  } = require("@etron/data-sources-shared/repositories/dataBucketRepository");
const { getDataSchema, saveSchema } = require("../repositories/dataBucketRepository");
const { runQuery, createAthenaTable } = require("./athenaService");

async function saveSchemaAndUpdateTable(workspaceId, dataSourceId, newSchema) {
    const tableName = `ds_${dataSourceId}`;
    const database = process.env.ATHENA_DATABASE;
    const dataLocation = `s3://${process.env.WORKSPACE_BUCKET}/workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/data/`
    const outputLocation = `s3://${process.env.WORKSPACE_BUCKET}/workspaces/${workspaceId}/day-book/athenaResults/`;

    const existingSchema = getDataSchema(workspaceId, dataSourceId);

    if (!hasSchemaChanged(existingSchema, newSchema)) {
        console.log("No changes between schemas");
        return;
    }

    // update the athena table
    await updateTable(workspaceId, dataSourceId, newSchema, tableName, database, outputLocation, dataLocation);

    // save the new schema
    saveSchema(newSchema);

    return;
}

async function updateTable(workspaceId, dataSourceId, newSchema, tableName, database, outputLocation, dataLocation) {
    //const { added, removed, };
    
    // recreate table
    await runQuery(`DROP TABLE IF EXISTS ${tableName}`, database, outputLocation);
    await createAthenaTable(workspaceId, dataSourceId, newSchema, tableName, dataLocation, database, outputLocation);
}

function hasSchemaChanged(oldSchema, newSchema) {
    // if theres not an existing schema flag as changed
    if (!oldSchema) return true;

    const oldSchemaNormalised = normaliseSchema(oldSchema);
    const newSchemaNormalised = normaliseSchema(newSchema);

    return JSON.stringify(oldSchemaNormalised) !== JSON.stringify(newSchemaNormalised);
}

function normaliseSchema(schema) {
    return schema
        .map(column => ({ name: column.name, type: column.type }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

function generateSchema(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Cannot generate a schema from invalid data");
    }

    // for efficently sample a small amount of data
    const sampleData = data.slice(0, 100);

    const schema = {};
    for (const row of sampleData) {
        for (const [column, value] of Object.entries(row)) {
            if (!schema[column]) {
                schema[column] = deduceType(value);
            } else {
                // fallback to string
                const deducedType = deduceType(value);
                if (schema[column] !== deducedType) {
                    schema[column] = "string";
                }

            }
        }
    }

    return Object.entries(schema).map(([name, type]) => ({ name, type }));
}

function deduceType(value, columnName = "") {

    if (typeof value === "number") {
        return Number.isInteger(value) ? "bigint" : "double";
    } else if (typeof value === "boolean") {
        return "boolean";
    } else if (typeof value === "string") {
        const trimmed = value.trim();
        // numeric strings
        if (!isNaN(trimmed) && trimmed !== "") {
            if (trimmed.includes(".")) {
                if (isMoneyField(columnName)) {
                    return "decimal(18,2)";
                }
                return "double";
            }
            return "bigint";
        }
    
        // strings that look like timestamps
        if (!isNaN(Date.parse(value))) {
            return "timestamp";
        }
    }
    return "string";
}

function isMoneyField(columnName) {
    const moneyKeywords = ["balance", "price", "amount", "cost", "total"];
    return moneyKeywords.some(keyword => columnName.toLowerCase().includes(keyword));
}

module.exports = {
    generateSchema,
    saveSchemaAndUpdateTable
};