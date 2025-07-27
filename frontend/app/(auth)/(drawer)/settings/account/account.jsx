import { View, ScrollView } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from '../../../../../components/layout/StackLayout';
import DescriptiveButton from '../../../../../components/common/buttons/DescriptiveButton';
import { router } from 'expo-router';
import { useState } from "react";
import { apiDelete } from '../../../../../utils/api/apiClient';
import BasicDialog from '../../../../../components/overlays/BasicDialog';
import { useTheme } from "react-native-paper";


const Account = () => {
    const theme = useTheme();

    const [dialogVisible, setDialogVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);




    const accountSettingsButtons = [
        { label: "Personal Details", description: "Update first and last name, phone number, and avatar", onPress: () => router.push("/settings/account/personal-details")},
        { label: "Password and Security", onPress: () => router.push("/settings/account/password-security") },
        { label: "Delete Account", onPress: () => setDialogVisible(true)}
    ]

    async function handleDelete() {
        const validPassword = await verifyPassword(password);

        if(!validPassword) {
            setPasswordError(true);
            return;
        }

        try {
            // TODO: replace
            const response = await apiDelete('');
            console.log("Account deleted successfully: ", response);
            setDialogVisible(false);
            router.replace("/landing");
        } catch (error) {
            console.log("Error deleting account: ", error);
        }
    }

    return(
        <View style={commonStyles.screen}>
            <Header title="Manage Account" showBack></Header>
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer} >
                <StackLayout spacing={127}>
                    <DescriptiveButton
                        key={"Profiles"}
                        label={"Profiles"}
                    />
                    <StackLayout spacing={12}>
                        {accountSettingsButtons.map((item) => (
                            <DescriptiveButton
                                key={item.label}
                                label={item.label}
                                description={item.description}
                                onPress={item.onPress}
                            />
                        ))}
                    </StackLayout>
                </StackLayout>
            </ScrollView>
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
        </View>
    )
}

export default Account;