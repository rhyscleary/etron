// Author(s): Rhys Cleary
const mysql = require('mysql2/promise');
const { testConnection } = require('../services/dataSourceService');

// validate the configurations before creating the data source
function validateConfig(config) {
    if (!config) return { valid: false, error: "Config is missing"};

    // define required fields
    const requiredFields = ["host", "port", "databaseName", "tables"];
    for (const field of requiredFields) {
        if (!config[field]) return { valid: false, error: `${field} is required`};
    }
    if (!Array.isArray(config.tables)) return { valid: false, error: "A list of tables is required"};

    return { valid: true };
}

// validate the secrets before creating the data source
function validateSecrets(secrets) {
    if (!secrets) return { valid: false, error: "Secrets are missing"};
    if (!secrets.username || !secrets.password) return { valid: false, error: "username and password are required"};
    return { valid: true };
}

// validate the data fetched
function validateData(data) {
    // stub implementation 
    return { valid: true };
}

// normalize data
function translateData(data) {
    // stub implementation
    return data;
}

function testConnection() {
    // poll the data source
}

function formatValidation(data) {

}

function translateData(data) {

}


// poll server
async function poll(config, secrets) {
    let connection;
    try {
        // construct options
        const options = {
            host: config.host,
            port: config.port,
            user: secrets.username,
            password: secrets.password,
            database: config.database,
            ssl: config.sslCa ? { ca: config.sslCa } : undefined,
        }

        connection = await mysql.createConnection(options);

        // get query and query table

        

        // validate the response data
        const dataValidation = validateDataStructure(rawData);
        if (!dataValidation.valid) {
            throw new Error(`Validation failed: ${dataValidation.error}`);
        }

        // translate the fetched data
        return translateData(rawData);

    } catch (error) {
        throw new Error(error.message);
    } finally {
        if (connection) await connection.end();
    }
}

module.exports = {
    validateConfig,
    validateSecrets,
    validateData,
    translateData,
    supportsPolling: true,
    poll
};