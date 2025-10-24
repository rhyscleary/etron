// Author(s): Holly Wyatt, Noah Bradley

import { View, ScrollView, ActivityIndicator, StyleSheet, Platform, Keyboard } from 'react-native'
import { commonStyles } from '../../../../assets/styles/stylesheets/common';
import Header from '../../../../components/layout/Header';
import StackLayout from '../../../../components/layout/StackLayout';
import DescriptiveButton from '../../../../components/common/buttons/DescriptiveButton';
import { router } from 'expo-router';
import { useEffect, useState } from "react";
import { apiDelete } from '../../../../utils/api/apiClient';
import BasicDialog from '../../../../components/overlays/BasicDialog';
import { useTheme } from "react-native-paper";
import { useVerification } from '../../../../contexts/VerificationContext';
import { verifyPassword } from '../../../../utils/verifyPassword';
import endpoints from '../../../../utils/api/endpoints';

import {
    getCurrentUser,
    deleteUser,
    signOut,
    updateUserAttribute,
} from 'aws-amplify/auth';
import BasicButton from '../../../../components/common/buttons/BasicButton';
import ResponsiveScreen from '../../../../components/layout/ResponsiveScreen';
import { getWorkspaceId } from '../../../../storage/workspaceStorage';

const Account = () => {
    const theme = useTheme();

    const [dialogVisible, setDialogVisible] = useState(false);
    const [leaveDialogVisible, setLeaveDialogVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [leavePassword, setLeavePassword] = useState("");
    const [leavePasswordError, setLeavePasswordError] = useState(false);
    const [leavePasswordErrorMessage, setLeavePasswordErrorMessage] = useState("");

    useEffect(() => {
        setLoading(true);
        async function loadAccountEmail() {
            try {
                // load the current users email from Cognito
                const { username, userId, signInDetails } = await getCurrentUser();
                setEmail(signInDetails.loginId);
            } catch (error) {
                console.error("Error loading email: ", error);
                setEmail("Error accessing email.");
            }
            setLoading(false);
        }
        loadAccountEmail();
    }, []);

    const accountSettingsButtons = [
        { label: "Personal Details", description: "Update first and last name, phone number, and avatar", onPress: () => router.navigate("account-settings/personal-details")},
        { label: "Password and Security", onPress: () => router.navigate("account-settings/password-security") },
        { label: "Delete Account", onPress: () => setDialogVisible(true)}
    ]

    async function handleDelete() {
        setDeleting(true);
        const validPassword = await verifyPassword(password); // verify the password before deleting

        if (!validPassword) {
            setPasswordError(true);
            console.log("INVALID PASSWORD");
            setDeleting(false);
            return;
        }

        console.log("HERE");

        try {
            const workspaceId = await getWorkspaceId();
            const { userId } = await getCurrentUser();
            try {  // Deletes user details from workspace
                await apiDelete(endpoints.workspace.users.remove(workspaceId, userId));
            } catch (error) {
                console.log("Error deleting user details in workspace:", error);
                return;
            }
            await deleteUser();  // Deletes user from Cognito
            setDialogVisible(false);
            router.dismissAll();
            router.replace("/landing");
        } catch (error) {
            console.error("Error deleting account: ", error);
        } finally {
            setDeleting(false);
        }
    }

    async function handleLeaveWorkspace() {
        console.log("TEST0");
        Keyboard.dismiss();
        setLeaving(true);

        console.log("TEST1");

        if (!leavePassword) {
            setLeavePasswordErrorMessage("Please enter your password.");
            setLeavePasswordError(true);
            setLeaving(false);
            return;
        }
        const valid = await verifyPassword(leavePassword);

        console.log("TEST2");

        if (!valid) {
            setLeavePasswordErrorMessage("The password entered is invalid.");
            setLeavePasswordError(true);
            setLeaving(false);
            return;
        }

        try {
            const workspaceId = await getWorkspaceId();
            const { userId } = await getCurrentUser();
            await apiDelete(endpoints.workspace.users.remove(workspaceId, userId));
            setLeaveDialogVisible(false);
            router.navigate("/workspace-choice");
        } catch (error) {
            console.error("Error leaving workspace:", error);
        } finally {
            setLeaving(false);
            setLeavePassword("");
            setLeavePasswordError(false);
            setLeavePasswordErrorMessage("");
        }
    }

    return(
        <ResponsiveScreen
            header = {<Header title="My Account" showMenu />}
            center = {false}
            loadingOverlayActive={deleting || leaving}
        >
            <StackLayout spacing={12}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <DescriptiveButton
                        key={"Accounts"}
                        label={"Accounts"}
                        description={email}
                        onPress={() => router.navigate("account-settings/accounts")}
                    />
                )}
                {accountSettingsButtons.map((item) => (
                    <DescriptiveButton
                        key={item.label}
                        label={item.label}
                        description={item.description}
                        onPress={item.onPress}
                    />
                ))}
                <View style={[commonStyles.inlineButtonContainer, { justifyContent: 'space-between' }]}>
                    <BasicButton
                        label={"Sign Out"}
                        onPress={() => signOut()}
                    />
                    <BasicButton
                        label={"Leave Workspace"}
                        danger
                        onPress={() => setLeaveDialogVisible(true)}
                    />
                </View>
            </StackLayout>
                
            <BasicDialog
                visible={dialogVisible}
                message={"Are you sure you want to delete your account? You will have seven days to login before your data is permanently removed."}
                showInput
                inputLabel={"Password"}
                inputPlaceholder={"Enter Password"}
                inputValue={password}
                inputOnChangeText={(text) => {
                    setPassword(text);
                    if (text) {
                        setPasswordError(false);
                    }
                }}
                inputError={passwordError}
                inputErrorMessage={"Incorrect password"}
                secureTextEntry={true}
                leftActionLabel="Go Back"
                handleLeftAction={() => {
                    setDialogVisible(false);
                    setPassword("");
                    setPasswordError(false);
                }}
                rightActionLabel={"Confirm"}
                rightDanger
                handleRightAction={handleDelete}
            />

            <BasicDialog
                visible={leaveDialogVisible}
                onDismiss={() => {
                    setLeaveDialogVisible(false);
                    setLeavePassword("");
                    setLeavePasswordError(false);
                    setLeavePasswordErrorMessage("");
                }}
                title="Leave Workspace"
                message="Enter your password to confirm leaving this workspace."
                showInput
                inputLabel="Password"
                inputPlaceholder="Enter your password"
                inputValue={leavePassword}
                inputOnChangeText={(text) => {
                    setLeavePassword(text);
                    if (text) setLeavePasswordError(false);
                }}
                inputError={leavePasswordError}
                inputErrorMessage={leavePasswordErrorMessage}
                secureTextEntry
                leftActionLabel="Cancel"
                handleLeftAction={() => {
                    setLeaveDialogVisible(false);
                    setLeavePassword("");
                    setLeavePasswordError(false);
                    setLeavePasswordErrorMessage("");
                }}
                rightActionLabel="Leave Workspace"
                rightDanger
                rightDisabled={!leavePassword}
                handleRightAction={handleLeaveWorkspace}
                inputProps={{
                    autoCapitalize: 'none',
                    autoCorrect: false,
                    keyboardType: Platform.OS === 'android' ? 'visible-password' : 'default',
                    onSubmitEditing: handleLeaveWorkspace,
                }}
            />
        </ResponsiveScreen>
    )
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default Account;

