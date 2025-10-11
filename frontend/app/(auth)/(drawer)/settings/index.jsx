// Author(s): Rhys Cleary

import { View, ScrollView, Pressable, Button } from 'react-native'
import { Link, router } from 'expo-router';
import StackLayout from '../../../../components/layout/StackLayout';
import { Text } from 'react-native-paper';
import Header from '../../../../components/layout/Header';
import DescriptiveButton from '../../../../components/common/buttons/DescriptiveButton';
import { commonStyles } from '../../../../assets/styles/stylesheets/common';
import ResponsiveScreen from '../../../../components/layout/ResponsiveScreen';
import { useEffect, useState } from 'react';
import { hasPermission } from '../../../../utils/permissions';

const Settings = () => { 
    const [menuOptions, setMenuOptions] = useState([]);

    // container for different setting options
    const settingButtonMap = [
        { 
            icon: "account", 
            label: "Account", 
            onPress: () => router.navigate("/settings/account/account")
        },
        {
            permKey: "app.workspace.view_workspace_settings", 
            icon: "briefcase-outline", 
            label: "Workspace", 
            onPress: () => router.navigate("/settings/workspace/workspace-management") 
        },
        { 
            icon: "palette-outline", 
            label: "Themes", 
            onPress: () => router.navigate("/settings/theme-settings") 
        },
        { 
            image: require("../../../../assets/icons/menu/accessibility.png"), 
            label: "Accessibility", 
            onPress: () => router.navigate("/settings/accessibility-settings") 
        },
        { 
            icon: "information-outline", 
            label: "Support", 
            onPress: () => router.navigate("/settings/support-settings") 
        },
        { 
            image: require("../../../../assets/icons/menu/privacy_policy.png"), 
            label: "Privacy Policy", 
        },
        { 
            icon: "file-document-multiple-outline", 
            label: "Terms and Conditions",
        },
    ];

    useEffect(() => {
        async function filterButtions() {
            const filteredOptions = [];
            for (const option of settingButtonMap) {
                const allowed = option.permKey ? await hasPermission(option.permKey) : true;
                if (allowed) filteredOptions.push(option);
            }
            setMenuOptions(filteredOptions);
        }

        filterButtions();
    }, []);

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
                {menuOptions.map((item) => (
                    <DescriptiveButton 
                        key={item.label}
                        icon={item.icon}
                        image={item.image}
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