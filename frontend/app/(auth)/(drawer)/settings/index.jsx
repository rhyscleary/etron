// Author(s): Rhys Cleary

import { View, ScrollView, Pressable, Button } from 'react-native'
import { Link, router } from 'expo-router';
import StackLayout from '../../../../components/layout/StackLayout';
import { Text } from 'react-native-paper';
import Header from '../../../../components/layout/Header';
import DescriptiveButton from '../../../../components/common/buttons/DescriptiveButton';
import { commonStyles } from '../../../../assets/styles/stylesheets/common';

const Settings = () => { 

    const settingOptionButtons = [
        { icon: "account", label: "Account", onPress: () => router.navigate("/settings/account/account")},
        { icon: "briefcase-outline", label: "Workspace", onPress: () => router.navigate("/settings/workspace/workspace-management") },
        { icon: "palette-outline", label: "Themes", onPress: () => router.navigate("/settings/theme-settings") },
        { icon: "", label: "Accessibility", onPress: () => router.navigate("/settings/accessibility-settings") },
        { icon: "information-outline", label: "Support", onPress: () => router.navigate("/settings/support-settings") },
        { icon: "", label: "Privacy Policy", },
        { icon: "file-document-multiple-outline", label: "Terms and Conditions",},
    ];

    return (
        <View style={commonStyles.screen}>
            <Header title="Settings" showMenu />
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
                    {/*Temporary redirect to profile screen*/}
                    <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/dashboard")}>
                        <Pressable>
                            <Text>Go to Profile</Text>
                        </Pressable>
                    </Button>
                    {settingOptionButtons.map((item) => (
                        <DescriptiveButton 
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={item.onPress}
                        />
                ))}
                </StackLayout>
            </ScrollView>

        </View>
    )
}

export default Settings;