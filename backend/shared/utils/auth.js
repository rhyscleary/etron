// Author(s): Rhys Cleary

const { 
    CognitoIdentityProviderClient, 
    ListUsersCommand, 
    AdminUpdateUserAttributesCommand 
} = require("@aws-sdk/client-cognito-identity-provider");

const cognito = new CognitoIdentityProviderClient({region: "ap-southeast-2"});

const userPoolId = "ap-southeast-2_v6f4XS4Ez";

async function getUserByEmail(email) {

    const result = await cognito.send(new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = \"${email}\"`,
        Limit: 1
    }));

    if (!result.Users || result.Users.length === 0) {
        throw new Error("User not found in the identity pool");
    }

    const user = result.Users[0];
    console.log(user);

    const attributes = user.Attributes.reduce((acc, attribute) => {
        acc[attribute.Name] = attribute.Value;
        return acc;
    }, {});

    return {
        userId: attributes.sub, 
        email: attributes.email,
        given_name: attributes.given_name,
        family_name: attributes.family_name,
        picture: attributes.picture
    };
}

async function getUserById(userId) {

    const result = await cognito.send(new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `sub = \"${userId}\"`,
        Limit: 1
    }));

    if (!result.Users || result.Users.length === 0) {
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
        given_name: attributes.given_name,
        family_name: attributes.family_name,
        picture: attributes.picture
    };
}

async function updateUser(userId, data) {
    const attributes = Object.entries(data).map(([key, value]) => ({
        Name: key,
        Value: value
    }));

    try {
        const result = await cognito.send(new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: userId,
            UserAttributes: attributes
        }));
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }

}


module.exports = {
    getUserByEmail,
    getUserById,
    updateUser
};