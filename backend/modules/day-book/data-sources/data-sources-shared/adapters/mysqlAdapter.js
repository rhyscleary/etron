// Author(s): Rhys Cleary
const mysql = require('mysql2/promise');
const fs = require("fs");
const path = require("path");
let tunnel;

// validate the configurations before creating the data source
function validateConfig(config) {
    if (!config) return { valid: false, error: "Config is missing"};

    // define required fields
    const requiredFields = ["host", "port", "database"];
    for (const field of requiredFields) {
        if (!config[field]) return { valid: false, error: `${field} is required`};
    }

    return { valid: true };
}

// validate the secrets before creating the data source
function validateSecrets(secrets) {
    if (!secrets) return { valid: false, error: "Secrets are missing"};
    if (!secrets.username || !secrets.password) {
        return { valid: false, error: "username and password are required"};
    }
    return { valid: true };
}

async function createTunnel(config, secrets) {
    if (!config.useSsh) return null;
    if (!tunnel) tunnel = require("tunnel-ssh");

    // create a new tunnel
    return new Promise((resolve, reject) => {
        tunnel(
            {
                host: config.sshHost,
                port: config.sshPort || 22,
                username: secrets.sshUser,
                privateKey: fs.readFileSync(secrets.sshKeyPath),
                dstHost: config.host,
                dstPort: config.port,
                localHost: "127.0.0.1",
                localPort: config.localPort || 0,
            },
            (error, server) => {
                if (error) return reject(error);
                const localPort =
                    server.address().port || config.localPort || config.port;
                resolve({ server, localPort });
            }
        );
    });
}

function buildSslConfig(config) {
    if (!cfg.useSsl) return null;
    const cas = [];
    if (cfg.sslCaPath && fs.existsSync(cfg.sslCaPath)) {
        cas.push(fs.readFileSync(cfg.sslCaPath, "utf8"));
    }
    if (
        cfg.sslCaDir &&
        fs.existsSync(cfg.sslCaDir) &&
        fs.statSync(cfg.sslCaDir).isDirectory()
    ) {
        const entries = fs.readdirSync(cfg.sslCaDir);
        for (const f of entries) {
        if (/\.pem$/i.test(f)) {
            cas.push(fs.readFileSync(path.join(cfg.sslCaDir, f), "utf8"));
        }
        }
    }
    if (cas.length === 0) {
        return { rejectUnauthorized: false }; // fallback to insecure connection
    }
    return { ca: cas, rejectUnauthorized: true };
}

async function exportAllTables(connection, database) {
    // get all the tables
    const [tableRows] = await connection.query("SHOW TABLES");
    if (!tableRows.length) return {};
    const tableKey = Object.keys(tableRows[0])[0];
    const tables = tableRows.map(row => row[tableKey]);

    const output = {};

    for (const table of tables) {
        // table schema
        const [createRes] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
        const createStmt = createRes[0]["Create Table"];

        // Primary keys with constraint names
        const [pkRows] = await connection.query(
            `
            SELECT COLUMN_NAME, CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME='PRIMARY'
            ORDER BY ORDINAL_POSITION
            `,
            [database, table]
        );

        const primaryKey = pkRows.map(row => ({
            column: row.COLUMN_NAME,
            constraintName: row.CONSTRAINT_NAME
        }));

        // Foreign keys with constraint names
        const [fkRows] = await connection.query(
            `
            SELECT
                COLUMN_NAME as columnName,
                CONSTRAINT_NAME as constraintName,
                REFERENCED_TABLE_NAME as referencedTable,
                REFERENCED_COLUMN_NAME as referencedColumn
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
            `,
            [database, table]
        );

        const foreignKeys = fkRows.map(row => ({
            column: row.columnName,
            referencedTable: row.referencedTable,
            referencedColumn: row.referencedColumn,
            constraintName: row.constraintName
        }));

        // get table data
        const [data] = await connection.query(`SELECT * FROM \`${table}\``);

        // add to output
        output[table] = {
            schema: createStmt,
            primaryKey,
            foreignKeys,
            data
        };
    }

    return output;
}

// flattern rows
function flattenTablesIntoRows(tables) {
    const rows = [];
    for (const [tableName, tableData] of Object.entries(tables)) {
        const { primaryKey, foreignKeys, data } = tableData;
        for (const row of data) {
            rows.push({
                table: tableName,
                ...row,
                primaryKey,
                foreignKeys,
            });
        }
    }
    return rows;
}


// poll server
async function poll(config, secrets) {
    let connection;
    let tunnelCtx;
    try {
        let host = config.host;
        let port = config.port;

        if (config.useSsh) {
            tunnelCtx = await createTunnel(config, secrets);
            host = "127.0.0.1";
            port = tunnelCtx.localPort;
        }

        // construct options
        const options = {
            host,
            port,
            user: secrets.username,
            password: secrets.password,
            database: config.database,
            connectTimeout: 15000,
            ssl: config.sslCa ? buildSslConfig(config) : undefined,
        }

        connection = await mysql.createConnection(options);

        const tables = await exportAllTables(connection, config.database);
        const flatRows = flattenTablesIntoRows(tables);
        
        return flatRows;

    } catch (error) {
        throw new Error(`MySQL poll failed: ${error.message}`);
    } finally {
        if (connection) await connection.end();
        if (tunnelCtx) tunnelCtx.server.close();
    }
}

module.exports = {
    validateConfig,
    validateSecrets,
    supportsPolling: true,
    poll
};