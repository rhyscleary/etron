import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  
  loginWith: {
    email: true,
    
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),

        scopes: ['email', 'profile', 'openid'],

        attributeMapping: {
          email: 'email',
          emailVerified: 'email_verified',
          givenName: 'given_name',
          familyName: 'family_name',
        }
      },
      callbackUrls: ["myapp://callback"],
      logoutUrls: ["myapp://signout"],
    }
  },

  userAttributes: {
    "custom:has_workspace": {
      dataType: "String",
      mutable: true,
    },
  },

});
