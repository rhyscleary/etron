// Author(s): Rhys Cleary

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

function deduceType(value) {
    if (typeof value === "number") {
        return Number.isInteger(value) ? "int" : "double";
    } else if (typeof value === "boolean") {
        return "boolean";
    } else if (typeof value === "string" && !isNaN(Date.parse(value))) {
        return "timestamp";
    }
    return "string";
}

module.exports = {
    generateSchema
};