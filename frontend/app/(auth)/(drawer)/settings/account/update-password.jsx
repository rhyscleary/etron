// Author(s): Holly Wyatt

import { useEffect, useState } from "react";
import { View, ScrollView } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from '../../../../../components/layout/StackLayout';
import { Text, useTheme } from "react-native-paper";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";

import { updatePassword } from 'aws-amplify/auth';

const UpdatePassword = () => {
    const theme = useTheme();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [notMatching, setNotMatching] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState("");
    const [errorDetails, setErrorDetails] = useState("");
    
    useEffect(() => {
        if (newPassword && confirmPassword) {
            setNotMatching(newPassword !== confirmPassword);
        } else {
            setNotMatching(false); // reset if one is empty
        }
    }, [newPassword, confirmPassword]);

    async function handleUpdatePassword(oldPassword, newPassword) {
        try {
            await updatePassword({
                oldPassword,
                newPassword
            });
            return { success: true };
        } catch (error) {
            console.error("Error updating password:", error);
            
            // handle the error based on its type
            let errorMessage = "There was an error updating your password";
            
            switch (error.name) {
                case 'NotAuthorizedException':
                    errorMessage = "Current password is incorrect";
                    break;
                case 'InvalidPasswordException':
                    errorMessage = "New password does not meet requirements";
                    break;
                case 'LimitExceededException':
                    errorMessage = "Too many attempts. Please try again later";
                    break;
                case 'InvalidParameterException':
                    errorMessage = "Password format is invalid";
                    break;
                default:
                    errorMessage = error.message || "There was an error updating your password";
            }
            
            return { success: false, error: errorMessage };
        }
    }
    
    async function handleUpdate(){
        setMessage("");
        setPasswordError(false);
        setErrorDetails("");

        // validation checks
        if (!currentPassword.trim()) {
            setErrorDetails("Please enter your current password");
            setPasswordError(true);
            return;
        }

        if (!newPassword.trim()) {
            setErrorDetails("Please enter a new password");
            setPasswordError(true);
            return;
        }

        if (!confirmPassword.trim()) {
            setErrorDetails("Please confirm your new password");
            setPasswordError(true);
            return;
        }

        if (notMatching) {
            return;
        }

        setUpdating(true);

        try {
            const result = await handleUpdatePassword(currentPassword, newPassword);
            
            if (result.success) {
                setMessage("Password updated successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError(false);
            } else {
                setPasswordError(true);
                setErrorDetails(result.error);
            }
        } catch (error) {
            console.error("Error updating password: ", error);
            setPasswordError(true);
            setErrorDetails("An unexpected error occurred");
        }

        setUpdating(false);
    }
    
    return(
        <View style={commonStyles.screen}>
            <Header title="Update Password" showBack></Header>
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer} >
                <StackLayout spacing={20}>
                    <StackLayout spacing={4}>
                        <Text style={commonStyles.listItemText}>Password</Text>
                        <Text style={commonStyles.captionText}>Your password must be at least 8 characters and should include a capital letter, number, and symbol. You cannot use a password you have used previously</Text>
                    </StackLayout>
                    
                    <TextField 
                        value={currentPassword}
                        placeholder="Enter current password"
                        secureTextEntry={true}
                        textContentType="password"
                        onChangeText={(text) => {
                            setCurrentPassword(text);
                            if (passwordError) {
                                setPasswordError(false);
                                setErrorDetails("");
                            }
                        }}
                    />
                    
                    <TextField 
                        value={newPassword}
                        secureTextEntry={true}
                        textContentType="newPassword"
                        placeholder="Enter new password"
                        onChangeText={(text) => {
                            setNewPassword(text);
                            if (passwordError) {
                                setPasswordError(false);
                                setErrorDetails("");
                            }
                        }}
                    />
                    
                    <TextField 
                        value={confirmPassword}
                        secureTextEntry={true}
                        placeholder="Confirm new password"
                        textContentType="newPassword"
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (passwordError) {
                                setPasswordError(false);
                                setErrorDetails("");
                            }
                        }}
                    />
                    
                    {notMatching && (
                        <Text style={{color: theme.colors.error}}>Passwords do not match</Text>
                    )}
                    
                    {passwordError && errorDetails && (
                        <Text style={{color: theme.colors.error}}>{errorDetails}</Text>
                    )}

                    {message && (
                        <Text style={{color: theme.colors.primary, textAlign: 'center'}}>
                            {message}
                        </Text>
                    )}
                    
                    <View style={commonStyles.inlineButtonContainer}>
                        <BasicButton 
                            label={updating ? "Updating..." : "Update"} 
                            onPress={handleUpdate}
                            disabled={updating || notMatching}
                        />
                    </View>
                </StackLayout>
            </ScrollView>
        </View>
    )
}

export default UpdatePassword;