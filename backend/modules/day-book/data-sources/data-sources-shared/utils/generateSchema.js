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
    generateSchema
};