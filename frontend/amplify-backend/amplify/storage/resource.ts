import { defineStorage } from '@aws-amplify/backend';

export const usersStorage = defineStorage({
	name: 'users',
	access: (allow) => ({
		'users/*': [
			allow.authenticated.to(['read', 'write', 'delete'])  //TODO: Customise these permissions to be as limited as reasonable
		]
	})
})

export const workspacesStorage = defineStorage({
	name: 'workspaces',
	access: (allow) => ({
		'workspaces/*': [
			allow.authenticated.to(['read', 'write', 'delete'])
		],
		'public/workspaces/*': [
    		allow.guest.to(['read'])
		]
	})
})

export const appConfigurationStorage = defineStorage({
	name: 'appConfiguration',
	isDefault: true,
	access: (allow) => ({
		'permissions/*': [
			allow.authenticated.to(['read'])
		],
		'modules/*': [
			allow.authenticated.to(['read'])
		]
	})
})