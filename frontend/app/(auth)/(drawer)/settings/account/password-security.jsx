import { useEffect, useState } from "react";
import { View, ScrollView } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from '../../../../../components/layout/StackLayout';
import { Text, useTheme } from "react-native-paper";
import { apiPut } from "../../../../../utils/api/apiClient";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";


const PasswordSecurity = () => {
    const theme = useTheme();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [notMatching, setNotMatching] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    
    useEffect(() => {
        if (newPassword && confirmPassword) {
            setNotMatching(newPassword !== confirmPassword);
        } else {
            setNotMatching(false); // reset if one is empty
        }
    }, [newPassword, confirmPassword]);
    
    async function handleUpdate(){
        if (notMatching) {
            return;
        }

        const passwordData = {
            currentPassword,
            newPassword,
        }
        try {
            // TODO: update endpoint here
            const response = await apiPut(
                ``,
                passwordData
            );
            // TODO: user feedback on successful update
            console.log("Password updated successfully: ", response);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordError(false);
        } catch (error) {
            console.log("Error updating password: ", error);
            setPasswordError(true);
        }
    }

    
    
    return(
        <View style={commonStyles.screen}>
            <Header title="Password and Security" showBack></Header>
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer} >
                <StackLayout spacing={20}>
                    <StackLayout spacing={4}>
                        <Text style={commonStyles.listItemText}>Password</Text>
                        <Text style={commonStyles.captionText}>Your password must be at least 12 characters and should include a capital letter, number, and symbol. You cannot use a password you have used previously</Text>
                    </StackLayout>
                    <TextField 
                        value={currentPassword}
                        placeholder={"Current password"}
                        secureTextEntry={true}
                        textContentType="password"
                        onChangeText={(text) => {
                            setCurrentPassword(text);
                        }}
                    />
                    <TextField 
                        value={newPassword}
                        secureTextEntry={true}
                        textContentType="newPassword"
                        placeholder={"New password"}
                        onChangeText={(text) => {
                            setNewPassword(text);
                        }}
                    />
                    <TextField 
                        value={confirmPassword}
                        placeholder={"Confirm new password"}
                        textContentType="newPassword"
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                        }}
                    />
                    {notMatching && (
                        <Text style={{color: theme.colors.error}}>Your password must match.</Text>
                    )}
                    {passwordError && (
                        <Text style={{color: theme.colors.error}}>There was an error updating your password</Text>
                    )}
                    <View style={commonStyles.inlineButtonContainer}>
                        <BasicButton label="Update" onPress={handleUpdate} />
                    </View>
                </StackLayout>
            </ScrollView>

        </View>
    )
}

export default PasswordSecurity;