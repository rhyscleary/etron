// Author(s): Rhys Cleary

import { View, ScrollView, Pressable } from 'react-native'
import { Link, router } from 'expo-router';
import StackLayout from '../../../../components/layout/StackLayout';
import { Text } from 'react-native-paper';
import Header from '../../../../components/layout/Header';
import DescriptiveButton from '../../../../components/common/buttons/DescriptiveButton';
import { commonStyles } from '../../../../assets/styles/stylesheets/common';

const Settings = () => { 

    const settingOptionButtons = [
        { icon: "account", label: "Account", onPress: () => router.push("/settings/account/account")},
        { icon: "briefcase-outline", label: "Workspace", onPress: () => router.push("/settings/workspace-management") },
        { icon: "palette-outline", label: "Themes", onPress: () => router.push("/settings/theme-settings") },
        { icon: "", label: "Accessibility", onPress: () => router.push("/settings/accessibility-settings") },
        { icon: "information-outline", label: "Support", onPress: () => router.push("/settings/support-settings") },
        { icon: "", label: "Privacy Policy", },
        { icon: "file-document-multiple-outline", label: "Terms and Conditions",},
    ];

    return (
        <View style={commonStyles.screen}>
            <Header title="Settings" showMenu />

            {/*Temporary redirect to profile screen*/}
            <Link href="/profile" asChild>
                <Pressable>
                    <Text>Go to Profile</Text>
                </Pressable>
            </Link>

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
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