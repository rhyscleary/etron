// Author(s): Rhys Cleary

import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { themes } from '../assets/styles/themes/themes';
import SafeView from '../components/layout/SafeView';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { VerificationProvider } from '../contexts/VerificationContext'; // temp until backend
import { AppProvider } from '../contexts/AppContext';
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
                <AppProvider>
                    <VerificationProvider> 
                        <GestureHandlerRootView style={{ flex: 1 }}>
                            <SafeAreaProvider>
                                <SafeView>            
                                    <Slot />
                                </SafeView>
                            </SafeAreaProvider>
                        </GestureHandlerRootView>
                    </VerificationProvider>
                </AppProvider>
            </Authenticator.Provider>
        </PaperProvider>
    );
}