// Author(s): Rhys Cleary
const axios = require('axios');

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

function constructHeader(authType, secrets) {
    switch (authType) {
        case "apiKey":
            return {Authorization: `${secrets.apiKey}`};
        case "bearer":
            return {Authorization: `Bearer ${secrets.token}`};
        default:
            return {}; 
    }
}

module.exports = {
    poll
};