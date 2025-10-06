const axios = require("axios");
const { SSM, CognitoIdentityServiceProvider } = require("aws-sdk");

const ssm = new SSM();
const cognito = new CognitoIdentityServiceProvider();

const USER_POOL_ID = process.env.USER_POOL_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const TOKEN_PATH = `/integrations/google/tokens`;

// Exchange authorization code for Google tokens
async function exchangeCodeForTokens(code) {
  const tokenResult = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return tokenResult.data; // { access_token, refresh_token, expires_in, id_token }
}

// Get Google user info from token
async function getGoogleUserInfo(accessToken) {
  const result = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return result.data; // includes email, name, sub (Google user id)
}

// Save refresh token securely in Parameter Store
async function saveTokensToSSM(cognitoUserId, tokens) {
  await ssm
    .putParameter({
      Name: `${TOKEN_PATH}/${cognitoUserId}`,
      Value: JSON.stringify(tokens),
      Type: "SecureString",
      Overwrite: true,
    })
    .promise();
  return { success: true };
}

// Retrieve tokens
async function getTokensForUser(cognitoUserId) {
  try {
    const param = await ssm
      .getParameter({
        Name: `${TOKEN_PATH}/${cognitoUserId}`,
        WithDecryption: true,
      })
      .promise();
    return JSON.parse(param.Parameter.Value);
  } catch {
    return null;
  }
}

// Link Google account to existing Cognito user
async function linkGoogleToCognitoUser(email, googleSub, tokens) {
  // Find the existing Cognito user
  const userSearch = await cognito
    .listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    })
    .promise();

  if (!userSearch.Users || userSearch.Users.length === 0) {
    throw new Error("No Cognito user found with this email");
  }

  const existingUser = userSearch.Users[0];

  // Link Google to Cognito
  await cognito
    .adminLinkProviderForUser({
      UserPoolId: USER_POOL_ID,
      DestinationUser: {
        ProviderName: "Cognito",
        ProviderAttributeValue: existingUser.Username,
      },
      SourceUser: {
        ProviderName: "Google",
        ProviderAttributeName: "Cognito_Subject",
        ProviderAttributeValue: googleSub,
      },
    })
    .promise();

  // Save tokens securely
  await saveTokensToSSM(existingUser.Username, tokens);

  return {
    message: `Linked Google account to Cognito user ${email}`,
    userId: existingUser.Username,
  };
}

module.exports = {
  exchangeCodeForTokens,
  getGoogleUserInfo,
  linkGoogleToCognitoUser,
  getTokensForUser,
};
