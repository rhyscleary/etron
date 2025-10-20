// Author(s): Holly Wyatt, Noah Bradley, Rhys Cleary

import { useEffect, useState } from "react";
import { commonStyles } from '../../../../assets/styles/stylesheets/common';
import Header from '../../../../components/layout/Header';
import StackLayout from "../../../../components/layout/StackLayout";
import TextField from "../../../../components/common/input/TextField";
import BasicButton from "../../../../components/common/buttons/BasicButton";
import { Text, useTheme } from "react-native-paper";
import { View, Button, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from 'buffer';
import { apiPut} from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import { router } from 'expo-router';

import {
    fetchUserAttributes,
    updateUserAttribute,
    confirmUserAttribute,
    getCurrentUser
} from 'aws-amplify/auth';
import { loadProfilePhoto, removeProfilePhotoFromLocalStorage, uploadProfilePhoto, getPhotoFromDevice, saveProfilePhoto } from "../../../../utils/profilePhoto";
import AvatarButton from "../../../../components/common/buttons/AvatarButton";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import UnsavedChangesDialog from "../../../../components/overlays/UnsavedChangesDialog";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";

global.Buffer = global.Buffer || Buffer

const PersonalDetails = () => {
    const theme = useTheme();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");
    const [needsPhoneConfirmation, setNeedsPhoneConfirmation] = useState(false);
    const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
    const [profilePhotoUri, setProfilePhotoUri] = useState(null);
    const [photoChanged, setPhotoChanged] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        phoneNumber: false,
    })

    useEffect(() => {
        loadProfileData();
    }, []);

    async function loadProfileData() {
        setLoading(true);
        try {
            const userAttributes = await fetchUserAttributes();
            console.log("User Attributes:", userAttributes);
            
            setFirstName(userAttributes.given_name || "");
            setLastName(userAttributes.family_name || "");
            // remove country code from phone number
            const phoneNumber = userAttributes.phone_number || "";
            const cleanPhone = phoneNumber.startsWith('+61') ? 
                phoneNumber.substring(3) : phoneNumber;
            setPhoneNumber(cleanPhone);

            const profilePhotoUri = await loadProfilePhoto();
            setProfilePhotoUri(profilePhotoUri || null);

            // set original values
            setOriginalData({
                firstName: userAttributes.given_name || "",
                lastName: userAttributes.family_name || "",
                phoneNumber: cleanPhone || "",
                profilePhotoUri: profilePhotoUri || null
            });
            
        } catch (error) {
            console.error("Error loading personal details: ", error);
            setMessage("Error loading personal details");
        }
        setLoading(false);
    }

    // Function for uploading photo to S3
    const handleUploadPhoto = async () => {
        try {
            const newUri = await getPhotoFromDevice();
            setProfilePhotoUri(newUri);
            setPhotoChanged(true);
        } catch (error) {
            console.error("Error uploading photo s3:", error.message);
        }
    }

    const handleRemovePhoto = () => {
        // this will show initials
        setProfilePhotoUri(null);
        setPhotoChanged(true);
    };

    useEffect(() => {  // Whenever user edits any data, check to see if it's different to the original and flag that a change exists
        const changed =
            firstName.trim() !== originalData.firstName ||
            lastName.trim() !== originalData.lastName ||
            phoneNumber.trim() !== originalData.phoneNumber ||
            profilePhotoUri !== originalData.profilePhotoUri;
        setHasUnsavedChanges(changed);
    }, [firstName, lastName, phoneNumber, profilePhotoUri, originalData]);


    // TODO: change this to whatever toast/alert method we're using
    /*async function handleConfirmPhoneNumber(userAttributeKey, confirmationCode) {
        try {
            await confirmUserAttribute({ userAttributeKey, confirmationCode });
            setMessage("Phone number confirmation successful");
            setNeedsPhoneConfirmation(false);
            setConfirmationCode("");
        } catch (error) {
            console.error("Error confirming user attribute:", error);
            setMessage(`Error confirming phone number: ${error.message}`);
        }
    }*/

    async function handleUpdate() {
        // Initialise the beginning of the update process
        setMessage("");
        setUpdating(true);
        
        // Array of potential errors; false unless there's an error
        const newErrors = {
            firstName: !firstName.trim(), // True (error) if empty
            lastName: !lastName.trim(),
            phoneNumber: phoneNumber && (phoneNumber.length < 9 || phoneNumber.length > 10),
        };
        setErrors(newErrors);

        // Stops update if any errors are present
        if (Object.values(newErrors).some(Boolean)) {
            setUpdating(false);
            return;
        }
        
        // Performs updates
        try {
            // Goes through each potential update, adding them to a json list if changed
            const updateData = {};

            if (firstName.trim() !== originalData.firstName) {
                updateData.given_name = firstName.trim();
            }

            if (lastName.trim() !== originalData.lastName) {
                updateData.family_name = lastName.trim();
            }

            if (phoneNumber.trim() !== originalData.phoneNumber) {
                const formattedPhone = phoneNumber.startsWith('+61') ? phoneNumber : `+61${phoneNumber}`;
                updateData.phone_number = formattedPhone.trim();
            }

            if (photoChanged) {
                if (profilePhotoUri) {
                    const s3Url = await saveProfilePhoto(profilePhotoUri);
                    updateData.picture = s3Url;
                } else {
                    updateData.picture = "";
                    await removeProfilePhotoFromLocalStorage();
                }
            }

            // If there are no changed fields, don't update anything
            if (Object.keys(updateData).length === 0) {
                setMessage("There are no changed fields to update");
                setUpdating(false);
                return;
            }

            let workspaceId = await getWorkspaceId();
            let { userId } = await getCurrentUser();
            
            await apiPut(
                endpoints.user.core.updateUser(userId, workspaceId),
                updateData
            );

            setOriginalData({
                firstName,
                lastName,
                phoneNumber,
                profilePhotoUri
            });
            setPhotoChanged(false);
            setMessage("Personal details updated successfully");
        } catch (error) {
            console.error("Error updating personal details: ", error);
            setMessage(`Error updating personal details: ${error.message}`);
        }

        setUpdating(false);
    }

    // Handles the confirmation code for updating phone number
    async function handlePhoneConfirmation() {
        if (!confirmationCode.trim()) {
            setMessage("Please enter the confirmation code");
            return;
        }
        await handleConfirmPhoneNumber("phone_number", confirmationCode);
    }

    function handleBackPress() {
        if (hasUnsavedChanges) {
            setShowUnsavedDialog(true);
        } else {
            router.back();
        }
    }

    function handleDiscardChanges() {
        setShowUnsavedDialog(false);
        router.back();
    }

    return (
        <ResponsiveScreen
            header = {<Header title="Personal Details" showBack onBackPress={handleBackPress}/>}
        >
            { loading ? (
                <View style={commonStyles.centeredContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <View>
                    <StackLayout spacing={34}>
                        <View style={{ alignItems: "center"}}>
                            <AvatarButton
                                type={profilePhotoUri ? "image" : "text"}
                                imageSource={profilePhotoUri ? {uri: profilePhotoUri} : undefined}
                                firstName={!profilePhotoUri ? originalData.firstName : firstName}
                                lastName={!profilePhotoUri ? originalData.lastName : lastName}
                                badgeType="edit"
                                onPress={handleUploadPhoto}
                            />
                        </View>
                        <Button title="Remove Photo" onPress={handleRemovePhoto} />

                        <TextField 
                            label="First Name"
                            value={firstName}
                            placeholder="First Name"
                            textContentType="givenName"
                            onChangeText={(text) => {
                                setFirstName(text);
                                if (text.trim()) {
                                    setErrors((prev) => ({ ...prev, first: false }));
                                }
                            }}
                        />
                        {errors.firstName && (
                            <Text style={{ color: theme.colors.error }}>Please enter your first name</Text>
                        )}

                        <TextField 
                            label="Last Name"
                            value={lastName}
                            textContentType="familyName"
                            placeholder="Last Name"
                            onChangeText={(text) => {
                                setLastName(text);
                                if (text.trim()) {
                                    setErrors((prev) => ({ ...prev, last: false }));
                                }
                            }}
                        />
                        {errors.lastName && (
                            <Text style={{ color: theme.colors.error }}>Please enter your last name</Text>
                        )}

                        <TextField 
                            label="Phone Number (Optional)"
                            value={phoneNumber}
                            placeholder="Phone Number"
                            maxLength={10}
                            keyboardType="numeric"
                            textContentType="telephoneNumber"
                            onChangeText={(text) => {
                                setPhoneNumber(text);
                                if (text.length >= 9 && text.length <= 10) {
                                    setErrors((prev) => ({ ...prev, phoneNumber: false }));
                                }
                            }}
                        />
                        {errors.phoneNumber && (
                            <Text style={{ color: theme.colors.error }}>Phone number must be 9-10 digits</Text>
                        )}

                        {needsPhoneConfirmation && (
                            <>
                                <TextField 
                                    label="Phone Confirmation Code"
                                    value={confirmationCode}
                                    placeholder="Confirmation Code"
                                    keyboardType="numeric"
                                    onChangeText={setConfirmationCode}
                                />
                                <BasicButton 
                                    label="Confirm Phone Number" 
                                    onPress={handlePhoneConfirmation}
                                />
                            </>
                        )}
                    </StackLayout>

                    <View style={{ flexDirection: 'row', justifyContent: 'center'}}>
                        {message && (
                            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                                <Text style={{ 
                                    color: message.includes('Error') || message.includes('error') ? 
                                        theme.colors.error : theme.colors.primary,
                                    textAlign: 'center'
                                }}>
                                    {message}
                                </Text>
                            </View>
                        )}
                        <View style={commonStyles.inlineButtonContainer}>
                            <BasicButton 
                                label={updating ? "Updating..." : "Update"} 
                                onPress={handleUpdate}
                                disabled={updating}
                            />
                        </View>
                    </View>

                    
                </View>
            )}

            <UnsavedChangesDialog
                visible={showUnsavedDialog}
                onDismiss={() => setShowUnsavedDialog(false)}
                handleLeftAction={handleDiscardChanges}
                handleRightAction={() => setShowUnsavedDialog(false)}
            />
        </ResponsiveScreen> 
    )
}

export default PersonalDetails;