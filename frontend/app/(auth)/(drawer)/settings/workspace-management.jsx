    // Author(s): Rhys Cleary

import { ScrollView, StyleSheet, View } from "react-native";
import { router, useRouter } from "expo-router";
import StackLayout from "../../../../components/layout/StackLayout";
import BasicDialog from "../../../../components/overlays/BasicDialog";
import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPut } from "../../../../utils/api/apiClient";
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
    const [users, setUsers] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState("");


    // container for different workspace management options
    const workspaceOptionButtons = [
            { label: "Workspace Details", description: "Update name, location and description", onPress: () => router.navigate("/settings/workspace-details") },
            { label: "Module Management", description: "Add and remove modules from the workspace", onPress: () => router.navigate("/settings/module-management") },
            { label: "Board Management", description: "Edit boards within the workspace", onPress: () => router.navigate("/settings/board-management") },
    ];

    useEffect(() => {
        async function fetchData() {
            const workspaceId = await getWorkspaceId();
            setWorkspaceId(workspaceId);

            try {
                const currentUser = await getCurrentUser();
                const currentUserId = currentUser.userId;

                const users = await apiGet(
                    endpoints.workspace.users.getUsers(workspaceId)
                );

                // filter out the current user (expected to be the current owner)
                const filteredList = users.filter(user => user.userId !== currentUserId);

                setUsers(filteredList);

            } catch (error) {
                console.error("Error loading users:", error);
            }
        }
        fetchData();
    }, []);

    async function handleConfirmDeletion() {
        if (!password) {
            setPasswordErrorMessage("Please enter your password.");
            setPasswordError(true);
            return;
        }

        const validPassword = await verifyPassword(password);
        
        if (!validPassword) {
            setPasswordErrorMessage("The password entered is invalid.");
            setPasswordError(true);
            return;
        }

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

        setPassword("");
        setPasswordError(false);
    }

    async function handleConfirmTransfer() {
        if (!password) {
            setPasswordErrorMessage("Please enter your password.");
            setPasswordError(true);
            return;
        }

        // validate password
        const validPassword = await verifyPassword(password);
        
        if (!validPassword) {
            setPasswordErrorMessage("The password entered is invalid.");
            setPasswordError(true);
            return;
        }

        if (workspaceId && selectedUser) {
            try {
                // transfer ownership
                console.log(selectedUser);

                const result = apiPut(
                    endpoints.workspace.core.transfer(workspaceId, selectedUser)
                );

                console.log("Ownership transferred:", result);
                setTransferDialogVisible(false);
            } catch (error) {
                console.log("Error transfering ownership: ", error);
            }
        }
        
        setPassword("");
        setPasswordError(false);
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
                inputErrorMessage={passwordErrorMessage}
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
                inputErrorMessage={passwordErrorMessage}
                secureTextEntry={true}
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
                    items={users.map(user => ({
                        label: `${user.given_name} ${user.family_name}`,
                        value: user.userId
                    }))}
                    showRouterButton={false}
                    onSelect={(userId) => setSelectedUser(userId)}
                />
            </BasicDialog>
        </View>
    )
}

export default WorkspaceManagement;