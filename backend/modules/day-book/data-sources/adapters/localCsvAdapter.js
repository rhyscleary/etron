// Author(s): Rhys Cleary

// validate the configurations before creating the data source
function validateConfig(config) {}

// validate the secrets before creating the data source
function validateSecrets(secrets, authType) {}

// poll server
async function poll(config, secrets) {}

module.exports = {
    validateConfig,
    validateSecrets,
    supportsPolling: false,
    poll
};