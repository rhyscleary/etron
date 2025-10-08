// Author(s): Rhys Cleary

import { View, ScrollView, Pressable, Button } from 'react-native'
import { Link, router } from 'expo-router';
import StackLayout from '../../../../components/layout/StackLayout';
import { Text } from 'react-native-paper';
import Header from '../../../../components/layout/Header';
import DescriptiveButton from '../../../../components/common/buttons/DescriptiveButton';
import { commonStyles } from '../../../../assets/styles/stylesheets/common';
import ResponsiveScreen from '../../../../components/layout/ResponsiveScreen';

const Settings = () => { 

    const settingOptionButtons = [
        { icon: "account", label: "Account", onPress: () => router.navigate("/settings/account/account")},
        { icon: "briefcase-outline", label: "Workspace", onPress: () => router.navigate("/settings/workspace-management") },
        { icon: "palette-outline", label: "Themes", onPress: () => router.navigate("/settings/theme-settings") },
        { icon: "", label: "Accessibility", onPress: () => router.navigate("/settings/accessibility-settings") },
        { icon: "information-outline", label: "Support", onPress: () => router.navigate("/settings/support-settings") },
        { icon: "", label: "Privacy Policy", },
        { icon: "file-document-multiple-outline", label: "Terms and Conditions",},
    ];

    return (
        <ResponsiveScreen
            header={
                <Header title="Settings" showMenu />
            }
            center={false}
            padded={false}
            scroll={true}
        >
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
        </ResponsiveScreen>
    )
}

export default Settings;