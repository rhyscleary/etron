// Author(s): Rhys Cleary
const axios = require('axios');

function validateConfig(config) {

}

function validateSecrets(secrets) {
    
}

function validateData() {
    
}

function translateData() {
    
}

async function getAvailableSheets(config, secrets) {

}

// poll google server
async function poll(config, secrets) {
    try {
        const requestHeader = constructHeader(config.authType, secrets);

        const response = await axios.get(config.endpoint, requestHeader);

        return response.data;

    } catch (error) {
        return {
            error: error.message
        }
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