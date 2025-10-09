// root layout for app

import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { themes } from '../assets/styles/themes/themes';
import SafeView from '../components/layout/SafeView';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import { useEffect } from 'react';
import { initializeAppStore } from '../stores/appStore';

import * as Linking from 'expo-linking';

Linking.addEventListener('url', (event) => {
    console.log('App was opened with URL:', event.url);
})

const currentTheme = themes['dark'];

export default function RootLayout() {
    // Initialize app store on mount
    useEffect(() => {
        initializeAppStore();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={currentTheme}>
                <Authenticator.Provider>
                    {/*Wrap the drawer layout around the safe area and the slot */}
                    <SafeAreaProvider>
                        <SafeView>            
                            <Slot />
                        </SafeView>
                    </SafeAreaProvider>
                </Authenticator.Provider>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}