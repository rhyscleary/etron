// Author(s): Rhys Cleary

import { useEffect, useState, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import ResponsiveScreen from '../../../../components/layout/ResponsiveScreen';
import Header from '../../../../components/layout/Header';
import StackLayout from '../../../../components/layout/StackLayout';
import DescriptiveButton from '../../../../components/common/buttons/DescriptiveButton';
import PermissionGate from '../../../../components/common/PermissionGate';
import { hasPermission } from '../../../../utils/permissions';

const Settings = () => { 
    const [menuOptions, setMenuOptions] = useState([]);


    const settingButtonMap = useMemo(() => [
        {
            permKey: 'app.workspace.view_workspace_settings',
            icon: 'briefcase-outline',
            label: 'Workspace',
            onPress: () => router.navigate('/settings/workspace/workspace-settings'),
        },
        /*{ 
            icon: "palette-outline", 
            label: "Themes", 
            onPress: () => router.navigate("/settings/theme-settings") 
        },*/
        /*{ 
            image: require("../../../../assets/icons/menu/accessibility.png"), 
            label: "Accessibility", 
            onPress: () => router.navigate("/settings/accessibility-settings") 
        },*/
        /*{ 
            icon: "information-outline", 
            label: "Support", 
            onPress: () => router.navigate("/settings/support-settings") 
        },*/
        /*{ 
            image: require("../../../../assets/icons/menu/privacy_policy.png"), 
            label: "Privacy Policy", 
        },*/
        /*{ 
            icon: "file-document-multiple-outline", 
            label: "Terms and Conditions",
        },*/
    ], []);

    const [allowedMap, setAllowedMap] = useState({});

    useEffect(() => {
        let mounted = true;
        async () => {
            const entries = await Promise.all(
                settingButtonMap.map(async (option) => {
                    if (!option.permKey) return [option.label, true];
                    try {
                        const allowed = await hasPermission(option.permKey);
                        return [option.label, !!allowed];
                    } catch {
                        return [option.label, false];
                    }
                })
            );
            if (mounted) setAllowedMap(Object.fromEntries(entries));
        };

        return () => {
            mounted = false;
        };
    }, [settingButtonMap]);

    return (
        <ResponsiveScreen
            header={
                <Header title="Settings" showMenu />
            }
            center={false}
            scroll={true}
        >
            <StackLayout spacing={12}>
                {settingButtonMap.map((item) => {
                    const allowed = item.permKey ? allowedMap[item.label] : true;
                    return (
                        <PermissionGate
                            key={item.label}
                            allowed={allowed}
                            onAllowed={item.onPress}
                        >
                            <DescriptiveButton
                                icon={item.icon}
                                image={item.image}
                                label={item.label}
                                description={item.description}
                            />
                        </PermissionGate>
                    );
                })}
                <Text>More options will be added to this page in the future.</Text>
            </StackLayout>
        </ResponsiveScreen>
    )
}

export default Settings;