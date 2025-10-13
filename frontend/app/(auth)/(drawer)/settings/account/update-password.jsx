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
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";

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
                    console.error("Error updating password:", error);
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
        <ResponsiveScreen
            header={<Header title="Update Password" showBack></Header>}
            center={false}
        >
            <View>
                <Text>Your password must include:</Text>
                <Text>{'\u2022'} At least 8 characters</Text>
                <Text>{'\u2022'} A capital letter</Text>
                <Text>{'\u2022'} A number</Text>
                <Text>{'\u2022'} A symbol</Text>
                <Text>
                    You cannot reuse a previous password.
                </Text>
            </View>

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

            {message ? (
                <Text style={{color: theme.colors.primary, textAlign: 'center'}}>
                    {message}
                </Text>
            ) : null}
            
            <View style={commonStyles.inlineButtonContainer}>
                <BasicButton 
                    label={updating ? "Updating..." : "Update"} 
                    onPress={handleUpdate}
                    disabled={updating || notMatching || !currentPassword || newPassword.length < 8 || confirmPassword.length < 8}
                />
            </View>
        </ResponsiveScreen>
    )
}

export default UpdatePassword;