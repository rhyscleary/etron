const { parse } = require("csv-parse/sync");

// normalize data
function translateData(data) {
    try {
        let rows;

        if (typeof data === "object") {
            rows = Array.isArray(data) ? data : [data];
        } else if (typeof data === "string") {
            data = data.trim();
            if (data.startsWith("{") || data.startsWith("[")) {
                const parsed = JSON.parse(data);
                rows = Array.isArray(parsed) ? parsed : [parsed];
            } else {
                rows = parse(data, { columns: true, skip_empty_lines: true });
            }
        } else {
            throw new Error("Unsupported data type received from the data source");
        }

        // add the time to each row
        const timestamp = new Date().toISOString();
        return rows.map(row => ({
            ...row,
            timestamp
        }));

    } catch (error) {
        throw new Error(`Failed to translate the data: ${error.message}`);
    }
}

module.exports = {
    translateData
};