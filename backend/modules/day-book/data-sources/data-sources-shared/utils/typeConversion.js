const parquet = require('parquetjs-lite');
const { Writable } = require('stream');

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

async function fromParquet(buffer, schema) {
    const reader = await parquet.ParquetReader.openBuffer(buffer);
    const cursor = reader.getCursor();
    const records = [];

    let record;
    while (record = await cursor.next()) {
        const casted = {};
        for (const column of schema) {
            let val = record[column.name];
            if (val == null) {
                casted[column.name] = null;
                continue;
            }
            switch (column.type) {
                case "bigint":
                    casted[column.name] = Number(val);
                    break;
                case "double":
                case "decimal(18,2)":
                    casted[column.name] = Number(val);
                    break;
                case "boolean":
                    casted[column.name] = Boolean(val);
                    break;
                case "timestamp":
                    casted[column.name] = new Date(val);
                    break;
                case "string":
                default:
                    casted[column.name] = String(val);
            }
        }
        records.push(record);
    }

    await reader.close();
    return records;
}

module.exports = { toParquet, fromParquet };