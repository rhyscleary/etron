// Author(s): Rhys Cleary

import { ScrollView, StyleSheet, View } from "react-native";
import { router, useRouter } from "expo-router";
import StackLayout from "../../../../../components/layout/StackLayout";
import BasicDialog from "../../../../../components/overlays/BasicDialog";
import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPut } from "../../../../../utils/api/apiClient";
import { useTheme } from "react-native-paper";
import { verifyPassword } from "../../../../../utils/verifyPassword";
import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../../components/common/buttons/DescriptiveButton";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import {
    getCurrentUser,
    signOut
} from 'aws-amplify/auth';
import DropDown from "../../../../../components/common/input/DropDown";
import { isOwnerRole } from "../../../../../storage/permissionsStorage";
import { hasPermission } from "../../../../../utils/permissions";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";

const WorkspaceManagement = () => {
    const router = useRouter();
    const theme = useTheme();

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [transferDialogVisible, setTransferDialogVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [menuOptions, setMenuOptions] = useState([]);


    // container for different workspace management options
    const permissionButtonMap = [
            {
                permKey: "app.workspace.update_workspace", 
                label: "Workspace Details", 
                description: "Update name, location and description", 
                onPress: () => router.navigate("settings/workspace/workspace-details") 
            },
            {
                permKey: "app.workspace.manage_modules", 
                label: "Module Management", 
                description: "Add and remove modules from the workspace", 
                onPress: () => router.navigate("settings/workspace/module-management") 
            },
            {
                permKey: "app.workspace.manage_boards",
                label: "Board Management", 
                description: "Edit boards within the workspace", 
                onPress: () => router.navigate("settings/workspace/board-management") 
            },
    ];

    useEffect(() => {
        async function fetchData() {
            const workspaceId = await getWorkspaceId();
            setWorkspaceId(workspaceId);
            console.log("WorkspaceId:", workspaceId);

            // check for owner role
            try {
                const ownerCheck = await isOwnerRole();
                setIsOwner(ownerCheck);
            } catch (error) {
                console.error("Error checking owner role:", error);
                setIsOwner(false);
            }

            // filter menu buttons by permissions
            const filteredOptions = [];
            for (const option of permissionButtonMap) {
                const allowed = option.permKey ? await hasPermission(option.permKey) : true;

                if (allowed) filteredOptions.push(option);
            }
            setMenuOptions(filteredOptions);

            if (!isOwner) return;

            try {
                const currentUser = await getCurrentUser();
                const currentUserId = currentUser.userId;

                const response = await apiGet(
                    endpoints.workspace.users.getUsers(workspaceId)
                );
                const users = response.data;

                // filter out the current user (expected to be the current owner)
                const filteredList = users.filter(user => user.userId !== currentUserId);

                setUsers(filteredList);

            } catch (error) {
                console.error("Error loading users:", error);
            }

            // fetch workspace roles
            try {
                const response = await apiGet(
                    endpoints.workspace.roles.getRoles(workspaceId)
                );
                const roles = response.data;

                // filter out the owner role
                const filteredList = roles.filter(role => !role.owner);

                setRoles(filteredList);
            } catch (error) {
                console.error("Error fetching roles:", error);
            }

        }
        fetchData();
    }, []);

    // DELETE WORKSPACE
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
                console.error("Error deleting workspace: ", error);
            }
        }

        setPassword("");
        setPasswordError(false);
    }

    // TRANSFER OWNERSHIP
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
                console.log(selectedRole);

                const transferPayload = {
                    receipientUserId: selectedUser,
                    newRoleId: selectedRole
                };

                const result = await apiPut(
                    endpoints.workspace.core.transfer(workspaceId),
                    transferPayload
                );

                console.log("Ownership transferred:", result.data);
                setTransferDialogVisible(false);
            } catch (error) {
                console.error("Error transfering ownership: ", error);
            }
        }
        
        setPassword("");
        setPasswordError(false);
    }

    return (
		<ResponsiveScreen
			header={
                <Header title="Workspace" showBack />
            }
			center={false}
			padded={false}
            scroll={true}
        >
		
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
                    {menuOptions.map(item => (
                        <DescriptiveButton 
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={item.onPress}
                        />
                    ))}
                </StackLayout>
                
                {isOwner && (
                    <View style={[commonStyles.inlineButtonContainer, {justifyContent: 'center'}]}>
                        <BasicButton label="Transfer Ownership" danger onPress={() => setTransferDialogVisible(true)}/>
                        <BasicButton label="Delete Workspace" danger onPress={() => setDeleteDialogVisible(true)}/>
                    </View>
                )}

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

                <DropDown 
                    title="Select Your New Role"
                    items={roles.map(role => ({
                        label: `${role.name}`,
                        value: role.roleId
                    }))}
                    showRouterButton={false}
                    onSelect={(roleId) => setSelectedRole(roleId)}
                />
            </BasicDialog>
        </ResponsiveScreen>
    )
}

export default WorkspaceManagement;