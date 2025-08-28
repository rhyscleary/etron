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

// validate the format of the data fetched
function validateFormat(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return { valid: false, error: "Data must be a non-empty array of sets" };
    }

    // loop through data sets
    for (let s = 0; s < data.length; s++) {
        const set = data[s];

        if (!Array.isArray(set) || set.length === 0) {
            return { valid: false, error: `Set ${s} must be a non-empty array of rows` };
        }

        const headerKeys = Object.keys(set[0]);
        const headerKeySet = new Set(headerKeys);

        // ensure that the keys are unique
        const uniqueKeys = new Set(headerKeys);
        if (uniqueKeys.size !== headerKeys)

        // validate each row
        for (let r = 0; r < set.length; r++) {
            const row = set[r];

            if (typeof row !== "object" || row === null || Array.isArray(row)) {
                return { valid: false, error: `Row ${r} in set ${s} is not an object` };
            }

            for (const [key, value] of Object.entries(row)) {
                if (value === null || value === undefined || value === "") {
                    return { valid: false, error: `Empty field for ${key} in set ${s}, row ${r}`};
                }
            }

            // ensure the keys (headers) in each row are consistent with the first
            const rowKeys = Object.keys(row);
            if (rowKeys.length !== headerKeys.length || !rowKeys.every(heading => headerKeySet.has(heading))) {
                return { valid: false, error: `Row ${r} in set ${s} has inconsistent headings with the first row`};
            }
        }

    }

    return { valid: true };
}

// normalize data
function translateData(data) {
    try {
        if (typeof data === "object") {
            return data;
        }

        if (typeof data === "string") {
            const parsed = JSON.parse(data);
            if (typeof parsed === "object" && parsed !== null) {
                return parsed;
            } else {
                throw new Error("The parsed data is not valid JSON object or an array");
            }
        }
        throw new Error("Unsupported data type received from the API");
    } catch (error) {
        throw new Error(`Failed to translate the data to JSON: ${error.message}`);
    }
}

// poll server
async function poll(config, secrets) {
    try {
        // construct headers
        let headers = constructHeader(config.authType, secrets);
        if (config.headers) headers = { ...headers, ...config.headers };

        const response = await axios.get(config.endpoint, { headers });

        // validate the response data
        /*const dataValidation = validateData(response.data);
        if (!dataValidation.valid) {
            throw new Error(`Validation failed: ${dataValidation.error}`);
        }*/

        // return data
        return response.data;

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
    validateFormat,
    translateData,
    supportsPolling: true,
    poll
};