import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
//import { data } from './data/resource';
import { usersStorage, workspacesStorage, appConfigurationStorage } from './storage/resource'

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  	auth,
	usersStorage,
	workspacesStorage,
	appConfigurationStorage
});
