// Author(s): Rhys Cleary

import { View, ScrollView } from 'react-native'
import Header from '../components/layout/Header';
import DescriptiveButton from '../components/common/buttons/DescriptiveButton';
import { router } from 'expo-router';
import { commonStyles } from '../assets/styles/stylesheets/common';

const Settings = () => { 

    const settingOptionButtons = [
        { icon: "account", label: "Account", },
        { icon: "", label: "Workspace", onPress: () => router.push("/workspace-management") },
        { icon: "palette-outline", label: "Themes", },
        { icon: "", label: "Accessibility",},
        { icon: "information-outline", label: "Support", },
        { icon: "", label: "Privacy Policy", },
        { icon: "", label: "Terms and Conditions",},
    ];

    return (
        <View>
            <Header title="Settings" showMenu />

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                {settingOptionButtons.map((item) => (
                    <DescriptiveButton 
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        description={item.description}
                        onPress={item.onPress}
                    />
                ))}
            </ScrollView>

        </View>
    )
}

export default Settings;