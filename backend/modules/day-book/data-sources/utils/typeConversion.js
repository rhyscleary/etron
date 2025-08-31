const parquet = require('parquetjs-lite');
const { Writable } = require('stream');

async function toParquet(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("The data must be a non-empty array");
    }

    const firstRow = data[0];
    const schemaDef = {};

    for (const [key, value] of Object.entries(firstRow)) {
        if (typeof value === "number" && Number.isInteger(value)) {
            schemaDef[key] = { type: 'INT64' };
        } else if (typeof value === "number") {
            schemaDef[key] = { type: 'DOUBLE' };
        } else if (typeof value === "boolean") {
            schemaDef[key] = { type: 'BOOLEAN' };
        } else {
            schemaDef[key] = { type: 'UTF8' };
        }
    }

    const schema = new parquet.ParquetSchema(schemaDef);

    let chunks = [];
    const writable = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });

    const writer = await parquet.ParquetWriter.openStream(schema, writable);

    for (const row of data) {
        await writer.appendRow(row);
    }

    await writer.close();

    return Buffer.concat(chunks);
}

module.exports = { toParquet };