    // Author(s): Rhys Cleary

import { ScrollView, StyleSheet, View } from "react-native";
import { router, useRouter } from "expo-router";
import StackLayout from "../../../../components/layout/StackLayout";
import BasicDialog from "../../../../components/overlays/BasicDialog";
import { useState } from "react";
import { apiDelete } from "../../../../utils/api/apiClient";
import { useTheme } from "react-native-paper";
import { verifyPassword } from "../../../../utils/verifyPassword";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../components/common/buttons/DescriptiveButton";
import BasicButton from "../../../../components/common/buttons/BasicButton";
import endpoints from "../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WorkspaceManagement = () => {
    const router = useRouter();
    const theme = useTheme();

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);


    // container for different workspace management options
    const workspaceOptionButtons = [
            { label: "Workspace Details", description: "Update name, location and description", onPress: () => router.navigate("/settings/workspace-details") },
            { label: "Module Management", description: "Add and remove modules from the workspace", onPress: () => router.navigate("/settings/module-management") },
            { label: "Profile Management", description: "Edit profiles within the workspace", onPress: () => router.navigate("/settings/profile-management") },
    ];

    async function handleConfirmDeletion() {
        const validPassword = await verifyPassword(password);
        
        if (!validPassword) {
            setPasswordError(true);
            return;
        }

        const workspaceId = await AsyncStorage.getItem("workspaceId");
        try {
            const result = await apiDelete(
                endpoints.workspace.core.delete(workspaceId)
            );

            console.log('Workspace deleted:', result);
            setDeleteDialogVisible(false);
            router.dismissAll();
            router.replace("/index"); //TODO: SHOULD REDIRECT YOU TO A BASE PAGE ASKING YOU TO JOIN OR CREATE A WORKSPACE
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
                secureTextEntry={true}
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