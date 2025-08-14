    // Author(s): Rhys Cleary

import { ScrollView, StyleSheet, View } from "react-native";
import { router, useRouter } from "expo-router";
import StackLayout from "../../../../components/layout/StackLayout";
import BasicDialog from "../../../../components/overlays/BasicDialog";
import { useEffect, useState } from "react";
import { apiDelete, apiGet } from "../../../../utils/api/apiClient";
import { useTheme } from "react-native-paper";
import { verifyPassword } from "../../../../utils/verifyPassword";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../components/common/buttons/DescriptiveButton";
import BasicButton from "../../../../components/common/buttons/BasicButton";
import endpoints from "../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import {
    getCurrentUser,
    signOut
} from 'aws-amplify/auth';
import DropDown from "../../../../components/common/input/DropDown";

const WorkspaceManagement = () => {
    const router = useRouter();
    const theme = useTheme();

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [transferDialogVisible, setTransferDialogVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [usersNames, setUsersNames] = useState([]);


    // container for different workspace management options
    const workspaceOptionButtons = [
            { label: "Workspace Details", description: "Update name, location and description", onPress: () => router.push("/settings/workspace-details") },
            { label: "Module Management", description: "Add and remove modules from the workspace", onPress: () => router.push("/settings/module-management") },
            { label: "Profile Management", description: "Edit profiles within the workspace", onPress: () => router.push("/settings/profile-management") },
    ];

    useEffect(() => {
        async function loadWorkspaceUsers() {
            try {
                const currentUser = await getCurrentUser();
                const currentUserId = currentUser.userId;

                const workspaceId = getWorkspaceId();

                const users = await apiGet(
                    endpoints.workspace.users.getUsers(workspaceId)
                );

                console.log(users);

                const filteredList = users.filter(user => user.userId !== currentUserId);

                setUsersNames(filteredList.map(user => user.firstName + " " + user.lastName));

            } catch (error) {
                console.error("Error loading users:", error);
            }
        }
        loadWorkspaceUsers();
    }, []);

    async function handleConfirmDeletion() {
        const validPassword = await verifyPassword(password);
        
        if (!validPassword) {
            setPasswordError(true);
            return;
        }

        const workspaceId = await getWorkspaceId();
        if (workspaceId) {
            try {
                const result = await apiDelete(
                    endpoints.workspace.core.delete(workspaceId)
                );

                console.log('Workspace deleted:', result);
                setDeleteDialogVisible(false);
            
                // sign out the user
                await signOut();


            } catch (error) {
                console.log("Error deleting workspace: ", error);
            }
        }
    }

    async function handleConfirmTransfer() {

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
                    <BasicButton label="Transfer Ownership" danger onPress={() => setTransferDialogVisible(true)}/>
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

            <BasicDialog
                visible={transferDialogVisible}
                title="Transfer Ownership"
                message="Select a user to transfer ownership of this workspace. Once transferred this cannot be undone."
                leftActionLabel="Cancel"
                handleLeftAction={() => {
                    setTransferDialogVisible(false);
                    setPassword("");
                    setPasswordError(false);
                }}
                rightActionLabel="Transfer"
                rightDanger
                handleRightAction={handleConfirmTransfer}
            >
                <DropDown 
                    title="Select User"
                    items={usersNames}
                    showRouterButton={false}
                    onSelect={(user) => setSelectedUser(user)}
                />
            </BasicDialog>
        </View>
    )
}

export default WorkspaceManagement;