// Author(s): Rhys Cleary

import { Slot, Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { themes } from '../assets/styles/themes/themes';
import { View, Text } from 'react-native'
import SafeView from '../components/layout/SafeView';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { VerificationProvider } from '../components/layout/VerificationContext'; // temp until backend
import { Amplify } from 'aws-amplify';

import * as Linking from 'expo-linking';

import awsmobile from '../src/aws-exports';
Amplify.configure({
    ...awsmobile /* all this stuff only works in amplify gen 2 storage; we're using gen 1 storage
    , 
    oauth: {
        domain: 'etrontest.auth.ap-southeast-2.amazoncognito.com',
        scope: ['email', 'openid', 'profile'],
        redirectSignIn: 'myapp://auth/',
        redirectSignOut: 'myapp://signout/',
        responseType: 'code'
    },
    Storage: {
        S3: {
            bucket: awsmobile.aws_user_files_s3_bucket,  //the default bucket
            region: awsmobile.aws_user_files_s3_bucket_region,

            buckets: {  //extra buckets
                etronProfilePhotos: {
                    bucketName: awsmobile.aws_user_files_s3_bucket,
                    region: awsmobile.aws_user_files_s3_bucket_region,
                },
                workspaceStoredData: {
                    bucketName: 'workspace-stored-data1858d-dev',
                    region: awsmobile.aws_project_region,
                },
            },

            defaultAccessLevel: 'public', //should probably change this in future to make privacy levels correct
        },
    },*/
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