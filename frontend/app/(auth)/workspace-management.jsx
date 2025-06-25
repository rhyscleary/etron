// Author(s): Rhys Cleary

import { ScrollView, StyleSheet, View } from "react-native";
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../components/common/buttons/DescriptiveButton";
import { useTheme } from "react-native-paper";
import { router } from "expo-router";
import BasicButton from "../../components/common/buttons/BasicButton";

const WorkspaceManagement = () => {
    const theme = useTheme();

    // container for different workspace management options
    const workspaceOptionButtons = [
            { label: "Workspace Details", description: "Update name, location and description", onPress: () => router.push("/workspace-details") },
            { label: "Module Management", description: "Add and remove modules from the workspace", onPress: () => router.push("/modules") },
            { label: "Profile Management", description: "Edit profiles within the workspace", onPress: () => router.push("/profiles") },
    ];

    return (
        <View>
            <Header title="Workspace" showBack />

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                {workspaceOptionButtons.map((item) => (
                    <DescriptiveButton 
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        description={item.description}
                        onPress={item.onPress}
                    />
                ))}

                <View style={styles.buttonContainer}>
                    <BasicButton label="Transfer Ownership" danger />
                    <BasicButton label="Delete Workspace" danger />
                </View>

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 20,
        gap: 32
    }
    
})

export default WorkspaceManagement;