// Author(s): Rhys Cleary

import { ScrollView, StyleSheet, View } from "react-native";
import Header from "../components/layout/Header";
import { commonStyles } from "../assets/styles/stylesheets/common";
import DescriptiveButton from "../components/common/buttons/DescriptiveButton";
import { router } from "expo-router";
import BasicButton from "../components/common/buttons/BasicButton";
import StackLayout from "../components/layout/StackLayout";

const WorkspaceManagement = () => {

    // container for different workspace management options
    const workspaceOptionButtons = [
            { label: "Workspace Details", description: "Update name, location and description", onPress: () => router.push("/workspace-details") },
            { label: "Module Management", description: "Add and remove modules from the workspace", onPress: () => router.push("/module-management") },
            { label: "Profile Management", description: "Edit profiles within the workspace", onPress: () => router.push("/profiles") },
    ];

    return (
        <View style={commonStyles.screen}>
            <Header title="Workspace" showBack />

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
                    {workspaceOptionButtons.map((item) => (
                        <DescriptiveButton 
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={item.onPress}
                        />
                    ))}
                </StackLayout>

                <View style={[commonStyles.inlineButtonContainer, {justifyContent: 'center'}]}>
                    <BasicButton label="Transfer Ownership" danger />
                    <BasicButton label="Delete Workspace" danger />
                </View>

            </ScrollView>
        </View>
    )
}

export default WorkspaceManagement;