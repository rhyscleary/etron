// Author(s): Rhys Cleary

import { Slot, Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { themes } from '../assets/styles/themes/themes';
import { View, Text, StatusBar, Platform } from 'react-native'
import SafeView from '../components/layout/SafeView';
import { Authenticator } from '@aws-amplify/ui-react-native';
import DrawerLayout from './(auth)/(drawer)/_layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar'

const currentTheme = themes['dark'];

export default function RootLayout() {
    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setButtonStyleAsync('dark');
        }
    }, []);

    return (    
        <PaperProvider theme={currentTheme}>
            <Authenticator.Provider>
                <GestureHandlerRootView style={{flex: 1, backgroundColor: currentTheme.colors.background}}>
                    <StatusBar backgroundColor={currentTheme.colors.background} />
                    <DrawerLayout>
                        <SafeView>
                            <Slot />
                        </SafeView>
                    </DrawerLayout>
                </GestureHandlerRootView>
            </Authenticator.Provider>
        </PaperProvider>
    );
}