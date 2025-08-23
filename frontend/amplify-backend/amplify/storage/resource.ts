import { defineStorage } from '@aws-amplify/backend';

export const profilePictureStorage = defineStorage({
  name: 'profilePictures',
  isDefault: true,
  access: (allow) => ({
    'profile-pictures/*': [allow.authenticated.to(['read', 'write', 'delete'])]
  })
});

