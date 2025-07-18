// Author(s): Rhys Cleary

import { ScrollView, StyleSheet, View } from "react-native";
import { router, useRouter } from "expo-router";
import StackLayout from "../../../../components/layout/StackLayout";
import BasicDialog from "../../../../components/overlays/BasicDialog";
import { useState } from "react";
import { apiDelete } from "../../../../utils/api";
import { useTheme } from "react-native-paper";
import { verifyPassword } from "../../../../utils/verifyPassword";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../components/common/buttons/DescriptiveButton";
import BasicButton from "../../../../components/common/buttons/BasicButton";

const WorkspaceManagement = () => {
    const router = useRouter();
    const theme = useTheme();

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);


    // container for different workspace management options
    const workspaceOptionButtons = [
            { label: "Workspace Details", description: "Update name, location and description", onPress: () => router.push("/settings/workspace-details") },
            { label: "Module Management", description: "Add and remove modules from the workspace", onPress: () => router.push("/settings/module-management") },
            { label: "Profile Management", description: "Edit profiles within the workspace", onPress: () => router.push("/settings/profile-management") },
    ];

    async function handleConfirmDeletion() {
        const validPassword = await verifyPassword(password);
        
        if (!validPassword) {
            setPasswordError(true);
            return;
        }

        try {
            const result = await apiDelete('');

            console.log('Workspace deleted:', result);
            setDeleteDialogVisible(false);

            router.replace("/index");
        } catch (error) {
            console.log("Error deleting workspace: ", error);
            
        }
    }

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
                    <BasicButton label="Delete Workspace" danger onPress={() => setDeleteDialogVisible(true)}/>
                </View>

            </ScrollView>

            <BasicDialog
                visible={deleteDialogVisible}
                title="Delete Workspace"
                message="Once you delete a workspace it will erase all of its data. This cannot be undone."
                showInput
                inputLabel="Password"
                inputPlaceholder="Enter your password"
                inputValue={password}
                inputOnChangeText={(text) => {
                    setPassword(text);
                    if (text) {
                        setPasswordError(false);
                    }
                }}
                inputError={passwordError}
                inputErrorMessage="The password entered is invalid."
                leftActionLabel="Cancel"
                handleLeftAction={() => {
                    setDeleteDialogVisible(false);
                    setPassword("");
                    setPasswordError(false);
                }}
                rightActionLabel="Delete"
                rightDanger
                handleRightAction={handleConfirmDeletion}
            />
        </View>
    )
}

export default WorkspaceManagement;