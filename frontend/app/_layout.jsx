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