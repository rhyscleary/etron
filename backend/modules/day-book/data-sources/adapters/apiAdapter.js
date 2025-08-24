// Author(s): Rhys Cleary
const axios = require('axios');

// validate the configurations before creating the data source
function validateConfig(config) {
    if (!config) return { valid: false, error: "Config is missing"};
    if (!config.endpoint) return { valid: false, error: "Endpoint is required"};
    // check that auth type is of a supported auth type
    if (config.authType && !["apiKey", "bearer", "jwt", "basic"].includes(config.authType)) { 
        return {valid: false, error: `Invalid authType: ${config.authType}`};
    }
    return { valid: true };
}

// validate the secrets before creating the data source
function validateSecrets(secrets, authType) {
    if (!authType) return { valid: true } // no secrets are required
    if (!secrets) return { valid: false, error: "Secrets are missing"};
    switch (authType) {
        case "apiKey":
            if (!secrets.apiKey) return { valid: false, error: "API key is required" };
            break;
        case "bearer":
        case "jwt":
            if (!secrets.token) return { valid: false, error: "Bearer token is required" };
            break;
        case "basic":
            if (!secrets.username || !secrets.password) return { valid: false, error: "Username and password are required"};
            break;
    }
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
    try {
        // construct headers
        let headers = constructHeader(config.authType, secrets);
        if (config.headers) headers = { ...headers, ...config.headers };

        const response = await axios.get(config.endpoint, { headers });

        // validate the response data
        const dataValidation = validateData(response.data);
        if (!dataValidation.valid) {
            throw new Error(`Validation failed: ${dataValidation.error}`);
        }

        // translate the fetched data
        return translateData(response.data);

    } catch (error) {
        throw new Error(`Poll failed: ${error.message}`);
    }
}

// construct auth headers
function constructHeader(authType, secrets) {
    switch (authType) {
        case "apiKey":
            return {Authorization: `${secrets.apiKey}`};
        case "bearer":
        case "jwt":
            return {Authorization: `Bearer ${secrets.token}`};
        case "basic": {
            const credentials = `${secrets.username}:${secrets.password}`;
            const encoded = Buffer.from(credentials).toString("base64");
            return { Authorization: `Basic ${encoded}` };
        }
        default:
            return {}; 
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