// Author(s): Holly Wyatt

import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from '../../../../../components/layout/StackLayout';
import DescriptiveButton from '../../../../../components/common/buttons/DescriptiveButton';
import { router } from 'expo-router';
import { useEffect, useState } from "react";
import { apiDelete } from '../../../../../utils/api/apiClient';
import BasicDialog from '../../../../../components/overlays/BasicDialog';
import { useTheme } from "react-native-paper";
import { useVerification } from '../../../../../contexts/VerificationContext';
import { verifyPassword } from '../../../../../utils/verifyPassword';
import endpoints from '../../../../../utils/api/endpoints';

import {
    getCurrentUser,
    deleteUser,
    signIn
} from 'aws-amplify/auth';
import BasicButton from '../../../../../components/common/buttons/BasicButton';
import ResponsiveScreen from '../../../../../components/layout/ResponsiveScreen';
import { getWorkspaceId } from '../../../../../storage/workspaceStorage';

const Account = () => {
    const theme = useTheme();

    const [dialogVisible, setDialogVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { verifyingPassword, setVerifyingPassword } = useVerification();

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
        { label: "Personal Details", description: "Update first and last name, phone number, and avatar", onPress: () => router.navigate("/settings/account/personal-details")},
        { label: "Password and Security", onPress: () => router.navigate("/settings/account/password-security") },
        { label: "Delete Account", onPress: () => setDialogVisible(true)}
    ]

    async function handleDelete() {
        setVerifyingPassword(true); // pause any redirect behavior

        const validPassword = await verifyPassword(password); // verify the password before deleting

        setVerifyingPassword(false);

        if (!validPassword) {
            setPasswordError(true);
            return;
        }

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
        }
    }

    return(
        <ResponsiveScreen
            header = {<Header title="Manage Account" showBack />}
            center = {false}
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
                        onPress={() => router.navigate("/settings/account/accounts")}
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

