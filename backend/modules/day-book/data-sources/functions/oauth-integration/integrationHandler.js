const {
  exchangeCodeForTokens,
  getGoogleUserInfo,
  linkGoogleToCognitoUser,
  getTokensForUser
} = require("./integrationService");

exports.handler = async (event) => {
  let statusCode = 200;
  let body;

  try {
    const requestJSON = event.body ? JSON.parse(event.body) : {};
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};
    const authUserId = event.requestContext.authorizer.claims.sub;

    if (!authUserId) {
      throw new Error("User not authenticated");
    }

    const routeKey = `${event.httpMethod} ${event.resource}`;

    switch (routeKey) {

      // LINK GOOGLE ACCOUNT
      case "POST /integrations/google/link": {
        const { code } = requestJSON;
        if (!code) throw new Error("Missing Google authorization code");

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);

        // Get Google user info
        const googleUser = await getGoogleUserInfo(tokens.access_token);

        // Link to existing Cognito user
        const result = await linkGoogleToCognitoUser(
          googleUser.email,
          googleUser.sub,
          {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            email: googleUser.email,
          }
        );

        body = result;
        break;
      }

      // GET TOKENS FOR THE USER
      case "GET /integrations/user-tokens": {
        body = await getTokensForUser(authUserId);
        if (!body) {
          statusCode = 404;
          body = { error: "No tokens found for user" };
        }
        break;
      }

      default:
        statusCode = 404;
        body = { message: `Unsupported route: ${event.routeKey}` };
        break;
    }

  } catch (error) {
    console.error("Integration handler error:", error);
    statusCode = 400;
    body = { error: error.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
  };
};