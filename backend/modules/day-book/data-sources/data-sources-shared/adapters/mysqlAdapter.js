// Author(s): Rhys Cleary
const mysql = require('mysql2/promise');

// validate the configurations before creating the data source
function validateConfig(config) {
    if (!config) return { valid: false, error: "Config is missing"};

    // define required fields
    const requiredFields = ["hostname", "port", "databaseName"];
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


// poll server
async function poll(config, secrets) {
    let connection;
    try {
        // construct options
        const options = {
            host: config.hostname,
            port: config.port,
            user: secrets.username,
            password: secrets.password,
            database: config.database,
            ssl: config.sslCa ? { ca: config.sslCa } : undefined,
        }

        connection = await mysql.createConnection(options);

        // create query and query table
        const query = `
            SELECT t.table_name,
                k.constraint_name,
                k.column_name,
                k.referenced_table_name,
                k.referenced_column_name
            FROM information_schema.tables t
            LEFT JOIN information_schema.key_column_usage k
            ON k.table_schema = t.table_schema
            AND k.table_name = t.table_name
            WHERE t.table_schema = 'sample_db'
            AND t.table_type='BASE TABLE'
            AND (k.constraint_name='PRIMARY' OR k.referenced_table_name IS NOT NULL)
            ORDER BY t.table_name, (k.constraint_name <> 'PRIMARY'), k.constraint_name, k.ordinal_position;
        `;

        const [rows] = await connection.execute(query, [config.database]);

        return rows;

    } catch (error) {
        throw new Error(`Poll failed: ${error.message}`);
    } finally {
        if (connection) await connection.end();
    }
}

module.exports = {
    validateConfig,
    validateSecrets,
    supportsPolling: true,
    poll
};