// Author(s): Rhys Cleary

import { Slot, Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { themes } from '../assets/styles/themes/themes';
import { View } from 'react-native'
import SafeView from '../components/layout/SafeView';

const currentTheme = themes['dark'];

export default function RootLayout() {
    return  (
        <SafeAreaProvider>
            <PaperProvider theme={currentTheme}>
                <SafeView>
                    <Slot />
                </SafeView>
            </PaperProvider>
        </SafeAreaProvider>
    );

}