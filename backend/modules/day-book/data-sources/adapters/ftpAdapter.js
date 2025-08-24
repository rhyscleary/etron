// Author(s): Rhys Cleary


function validateConfig(config) {

}

function validateSecrets(secrets) {
    
}

function validateData() {
    
}

function translateData() {
    
}


// poll ftp server
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
    poll
};