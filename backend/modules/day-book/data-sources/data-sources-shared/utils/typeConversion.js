const parquet = require('parquetjs-lite');
const { Writable } = require('stream');

/*async function toParquet(data) {
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
}*/

async function toParquet(data, schema) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("The data must be a non-empty array");
    }

    const schemaDef = {};

    for (const column of schema) {
        switch (column.type) {
            case "bigint":
                schemaDef[column.name] = { type: 'INT64' };
                break;
            case "double":
            case "decimal(18,2)":
                schemaDef[column.name] = { type: 'DOUBLE' };
                break;
            case "boolean":
                schemaDef[column.name] = { type: 'BOOLEAN' };
                break;
            case "timestamp":
                schemaDef[column.name] = { type: 'TIMESTAMP_MILLIS' };
                break;
            case "string":
            default:
                schemaDef[column.name] = { type: 'UTF8' };
                break;

        }
    }

    const parquetSchema = new parquet.ParquetSchema(schemaDef);

    let chunks = [];
    const writable = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });

    const writer = await parquet.ParquetWriter.openStream(parquetSchema, writable);

    for (const row of data) {
        const castedRow = {};
        for (const column of schema) {
            const name = column.name;
            const type = column.type;
            let value = row[name];

            if (value == null) {
                castedRow[name] = null;
                continue;
            }

            switch (type) {
                case "bigint":
                    castedRow[name] = Number(value);
                    break;
                case "double":
                case "decimal(18,2)":
                    castedRow[name] = Number(value);
                    break;
                case "boolean":
                    castedRow[name] = Boolean(value);
                    break;
                case "timestamp":
                    castedRow[name] = new Date(value);
                    break;
                case "string":
                default:
                    castedRow[name] = String(value);
            }
        }
        await writer.appendRow(castedRow);
    }

    await writer.close();

    return Buffer.concat(chunks);
}

async function fromParquet(buffer) {
    const reader = await parquet.ParquetReader.openBuffer(buffer);
    const cursor = reader.getCursor();
    const records = [];

    let record = null;
    while (record = await cursor.next()) {
        records.push(record);
    }

    await reader.close();
    return records;
}

module.exports = { toParquet, fromParquet };