// Author(s): Rhys Cleary

import { Slot, Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { themes } from '../assets/styles/themes/themes';
import { View, Text } from 'react-native'
import SafeView from '../components/layout/SafeView';
import { Authenticator } from '@aws-amplify/ui-react-native';

const currentTheme = themes['dark'];

export default function RootLayout() {
    return (    
        <PaperProvider theme={currentTheme}>
            <Authenticator.Provider>
                <SafeAreaProvider>
                    <SafeView>            
                        <Text>Base _layout</Text>
                        <Slot />
                    </SafeView>
                </SafeAreaProvider>
            </Authenticator.Provider>
        </PaperProvider>
    );
}