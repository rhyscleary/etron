// Author(s): Rhys Cleary

import { Slot, Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { themes } from '../assets/styles/themes/themes';
import SafeView from '../components/layout/SafeView';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { VerificationProvider } from '../components/layout/VerificationContext'; // temp until backend
import { Amplify } from 'aws-amplify';

import * as Linking from 'expo-linking';

//import awsmobile from '../src/aws-exports';
import amplifyOutputs from '../amplify_outputs.json'
Amplify.configure({
    ...amplifyOutputs,
    Storage: {
        S3: {
            bucket: amplifyOutputs.storage.bucket_name,  //the default bucket
            region: amplifyOutputs.storage.aws_region,

            buckets: {  //extra buckets
                profilePictures: {
                    bucketName: amplifyOutputs.storage.buckets[0].bucket_name,
                    region: amplifyOutputs.storage.buckets[0].aws_region,
                },
                workspaceStoredData: {
                    bucketName: 'workspace-stored-data1858d-dev',
                    region: amplifyOutputs.storage.aws_region,
                },
            },

            defaultAccessLevel: 'public', //should probably change this in future to make privacy levels correct
        },
    },
    
});
console.log('Amplify configured with:', Amplify.getConfig());

Linking.addEventListener('url', (event) => { //deep linking; used for microsoft/google sign in redirects
    console.log('App was opened with URL:', event.url);
})

const currentTheme = themes['dark'];

export default function RootLayout() {
    return (    
        <PaperProvider theme={currentTheme}>
            <Authenticator.Provider>
                {/*Wrap the drawer layout around the safe area and the slot */}
                {/* temp until backend */}
                <VerificationProvider> 
                    <SafeAreaProvider>
                        <SafeView>            
                            <Slot />
                        </SafeView>
                    </SafeAreaProvider>
                </VerificationProvider> 
            </Authenticator.Provider>
        </PaperProvider>
    );
}