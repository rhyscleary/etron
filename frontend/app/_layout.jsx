// Author(s): Rhys Cleary

import { Slot, Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { themes } from '../assets/styles/themes/themes';
import { View, Text } from 'react-native'
import SafeView from '../components/layout/SafeView';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DrawerLayout from './(auth)/(drawer)/_layout';

import * as Linking from 'expo-linking';

Linking.addEventListener('url', (event) => { //deep linking; used for microsoft/google sign in redirects
    console.log('App was opened with URL:', event.url);
})

const currentTheme = themes['dark'];

export default function RootLayout() {
    return (    
        <PaperProvider theme={currentTheme}>
            <Authenticator.Provider>
                <GestureHandlerRootView style={{ flex: 1, backgroundColor: currentTheme.colors.background }}>
                    <DrawerLayout>
                        <SafeAreaProvider>
                            <SafeView>
                                <Slot />
                            </SafeView>
                        </SafeAreaProvider>
                    </DrawerLayout>
                </GestureHandlerRootView>
            </Authenticator.Provider>
        </PaperProvider>
    );
}