import { defineStorage } from '@aws-amplify/backend';

export const profilePictureStorage = defineStorage({
    name: 'profilePictures',
    isDefault: true,
    access: (allow) => ({ //TO-DO: MAKE IT SO ONLY THE WORKSPACE MEMBERS CAN ACCESS THEIR WORKSPACE DATA
    	'profile-pictures/*': [allow.authenticated.to(['read', 'write', 'delete'])]
    })
});

export const workspaceReadyDataStorage = defineStorage({
	name: 'workspaceReadyData',
	access: (allow) => ({
		'ready-data/*': [
			allow.authenticated.to(['read', 'write', 'delete'])
		]
	})
});
