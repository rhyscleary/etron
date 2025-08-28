// Author(s): Rhys Cleary
const { Client } = require("basic-ftp");
const fs = require("fs");

// validate the configurations before creating the data source
function validateConfig(config) {
    if (!config) return { valid: false, error: "Config is missing"};

    // define required fields
    const requiredFields = ["hostname", "port", "filePath"];
    for (const field of requiredFields) {
        if (!config[field]) return { valid: false, error: `${field} is required`};
    }

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

// poll server
async function poll(config, secrets) {
    const client = new Client();
    client.ftp.verbose = false;

    try {
        const accessOptions = {
            host: config.hostname,
            port: config.port,
            user: secrets.username,
            password: secrets.password,
            secure: true,
        };

        if (secrets.keyFile) {
            accessOptions.password = undefined;
            accessOptions.privateKey = fs.readFileSync(secrets.keyFile, "utf-8");
        }

        await client.access(accessOptions);

        const remoteDirectory = config.directory || "/";
        const fileList = await client.list(remoteDirectory);

        const results = [];

        for (const file of fileList) {
            if (file.isDirectory) continue;


        }
        

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
        client.close();
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