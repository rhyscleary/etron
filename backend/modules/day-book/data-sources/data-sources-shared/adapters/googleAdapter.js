// Author(s): Rhys Cleary
const { SSM } = require('aws-sdk');
const { google } = require('googleapis');

const ssm = new SSM();
const TOKEN_PATH = `/integrations/google/tokens`;

async function getRefreshToken(authUserId) {
  const param = await ssm.getParameter({
    Name: `${TOKEN_PATH}/${authUserId}`,
    WithDecryption: true
  }).promise();

  return JSON.parse(param.Parameter.Value).refreshToken;
}

function validateConfig(config) {
    if (!config) return { valid: false, error: "Config is missing" };
    if (!config.spreadsheetId) return { valid: false, error: "spreadsheetId is required" };
    if (!config.range) return { valid: false, error: "range is required" };
    return { valid: true };
}

function validateSecrets(secrets) {
    if (!secrets) return { valid: false, error: "Secrets are missing" };
    if (!secrets.accessToken) return { valid: false, error: "accessToken is required" };
    if (!secrets.refreshToken) return { valid: false, error: "refreshToken is required" };
    return { valid: true };
}

async function getAvailableSheets(authUserId) {
    const refreshToken = await getRefreshToken(authUserId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Use Google Drive API to list spreadsheet files
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const res = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name, iconLink)'
    });

    return res.data.files.map(file => ({
        id: file.id,
        name: file.name,
        thumbnail: file.iconLink
    })); 
}

// poll google server
async function poll(config, secrets) {
    try {
        if (!config.spreadsheetId || !config.range) {
            throw new Error("Both 'spreadsheetId' and 'range' are required in config");
        }

        const oauth2Client = new google.auth.OAuth2();

        // set OAuth credentials
        oauth2Client.setCredentials({
            access_token: secrets.accessToken,
            refresh_token: secrets.refreshToken
        });

        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.spreadsheetId,
            range: config.range
        });

        return response.data.values || [];
    } catch (error) {
        return { error: error.message };
    }
}

module.exports = {
    getAvailableSheets,
    validateConfig,
    validateSecrets,
    supportsPolling: true,
    poll
};