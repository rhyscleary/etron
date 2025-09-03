// Author(s): Rhys Cleary, Noah Bradley

// validate the configurations before creating the data source
function validateConfig(config) {
    return true;
}

// validate the secrets before creating the data source
function validateSecrets(secrets, authType) {
    return true;
}

// poll server
async function poll(config, secrets) {
    return null;
}

module.exports = {
    validateConfig,
    validateSecrets,
    supportsPolling: false,
    poll
};