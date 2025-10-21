// Author(s): Rhys Cleary
const { Client } = require("basic-ftp");
const fs = require("fs");
const { Writable } = require("stream");

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

async function downloadFileToMemory(client, remotePath) {
    return new Promise(async (resolve, reject) => {
        let chunks = [];

        const writable = new Writable({
            write(chunk, encoding, callback) {
                chunks.push(chunk);
                callback();
            }
        });

        try {
            await client.downloadTo(writable, remotePath);
            const buffer = Buffer.concat(chunks);
            resolve(buffer.toString("utf-8"));
        } catch (error) {
            reject(error);
        }
    });
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

        const rawData = await downloadFileToMemory(client, config.filePath);
        
        // return the data to be translated
        return rawData;

    } catch (error) {
        throw new Error(error.message);
    } finally {
        client.close();
    }
}

module.exports = {
    validateConfig,
    validateSecrets,
    supportsPolling: true,
    poll
};