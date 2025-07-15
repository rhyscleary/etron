// Author(s): Rhys Cleary

const { CognitoIdentityProviderClient, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient();


async function getUserByEmail(email) {

    const userPoolId = "mjgihpivgnjha4216bcf1umsp";

    const result = await cognito.send(new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = \"${email}\"`,
        Limit: 1
    }));

    if (!result.Users) {
        throw new Error("User not found in the identity pool");
    }

    const user = result.Users[0];

    const attributes = user.Attributes.reduce((acc, attribute) => {
        acc[attribute.Name] = attribute.Value;
        return acc;
    }, {});

    return {
        userId: attributes.sub, 
        email: attributes.email, 
        preferred_username: attributes.preferred_username,
        given_name: attributes.given_name,
        family_name: attributes.family_name
    };
}

async function getUserById(userId) {

    const userPoolId = "mjgihpivgnjha4216bcf1umsp";

    const result = await cognito.send(new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `sub = \"${userId}\"`,
        Limit: 1
    }));

    if (!result.Users) {
        throw new Error("User not found in the identity pool");
    }

    const user = result.Users[0];

    const attributes = user.Attributes.reduce((acc, attribute) => {
        acc[attribute.Name] = attribute.Value;
        return acc;
    }, {});

    return {
        userId: attributes.sub, 
        email: attributes.email, 
        preferred_username: attributes.preferred_username,
        given_name: attributes.given_name,
        family_name: attributes.family_name
    };
}


module.exports = {
    getUserByEmail,
    getUserById
};