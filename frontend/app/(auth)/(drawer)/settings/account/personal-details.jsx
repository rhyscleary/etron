// Author(s): Holly Wyatt, Noah Bradley, Rhys Cleary

import { useEffect, useState } from "react";
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from "../../../../../components/layout/StackLayout";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import { Text, useTheme, Alert } from "react-native-paper";
import { Pressable, View, Button, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Image } from 'expo-image';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiPost, apiPut} from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { router } from 'expo-router';

import {
    fetchUserAttributes,
    updateUserAttribute,
    confirmUserAttribute,
    getCurrentUser
} from 'aws-amplify/auth';
import { loadProfilePhoto, removeProfilePhotoFromLocalStorage, uploadProfilePhoto, uploadProfilePhotoFromDevice, uploadProfilePhotoToS3 } from "../../../../../utils/profilePhoto";
import AvatarButton from "../../../../../components/common/buttons/AvatarButton";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import UnsavedChangesDialog from "../../../../../components/overlays/UnsavedChangesDialog";
import CountryPicker from 'react-native-country-picker-modal';

global.Buffer = global.Buffer || Buffer

const PersonalDetails = () => {
    const theme = useTheme();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [countryCca2, setCountryCca2] = useState('AU');
    const [callingCode, setCallingCode] = useState('61');
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

    // Minimal calling code to country mapping for initial detection
    const CALLING_CODE_TO_CCA2 = {
        '1': 'US', '44': 'GB', '61': 'AU', '64': 'NZ', '91': 'IN',
        '81': 'JP', '49': 'DE', '33': 'FR', '34': 'ES', '39': 'IT',
        '86': 'CN', '82': 'KR', '65': 'SG', '971': 'AE', '353': 'IE',
        '41': 'CH', '31': 'NL', '46': 'SE', '47': 'NO', '45': 'DK',
        '358': 'FI', '48': 'PL', '55': 'BR', '52': 'MX', '27': 'ZA',
        '351': 'PT', '62': 'ID', '63': 'PH', '60': 'MY', '66': 'TH',
        '90': 'TR', '7': 'RU', '380': 'UA', '420': 'CZ', '43': 'AT',
        '32': 'BE', '30': 'GR'
    };

    function parseE164(e164) {
        if (!e164 || !e164.startsWith('+')) return { callingCode: '61', number: '', cca2: 'AU' };
        const digits = e164.slice(1);
        const candidates = [3, 2, 1].map(n => digits.slice(0, n));
        for (const code of candidates) {
            if (CALLING_CODE_TO_CCA2[code]) {
                return { callingCode: code, number: digits.slice(code.length), cca2: CALLING_CODE_TO_CCA2[code] };
            }
        }
        return { callingCode: '61', number: digits.replace(/^\d{1,3}/, ''), cca2: 'AU' };
    }

    // Function for uploading photo to S3
    const handleUploadPhoto = async () => {
        try {
            const newUri = await uploadProfilePhotoFromDevice();
            setProfilePhotoUri(newUri);
            setPhotoChanged(true);
        } catch (error) {
            console.log(error.message);
        }
    }

    const handleRemovePhoto = () => {
        // this will show initials
        setProfilePhotoUri(null);
        setPhotoChanged(true);
    };

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
            // Parse country calling code and local number from E.164
            const fullPhone = userAttributes.phone_number || "";
            const parsed = parseE164(fullPhone);
            setCallingCode(parsed.callingCode);
            setCountryCca2(parsed.cca2);
            setPhoneNumber(parsed.number);

            const profilePhotoUri = await loadProfilePhoto();
            setProfilePhotoUri(profilePhotoUri || null);

            // set original values 
            setOriginalData({
                firstName: userAttributes.given_name || "",
                lastName: userAttributes.family_name || "",
                phoneNumber: parsed.number || "",
                callingCode: parsed.callingCode,
                countryCca2: parsed.cca2,
                profilePhotoUri: profilePhotoUri || null
            });
            
        } catch (error) {
            console.log("Error loading personal details: ", error);
            setMessage("Error loading personal details");
        }
        setLoading(false);
    }

    useEffect(() => {
        const changed =
            firstName.trim() !== originalData.firstName ||
            lastName.trim() !== originalData.lastName ||
        phoneNumber.trim() !== originalData.phoneNumber ||
        callingCode !== originalData.callingCode ||
            profilePhotoUri !== originalData.profilePhotoUri;
        setHasUnsavedChanges(changed);
    }, [firstName, lastName, phoneNumber, callingCode, profilePhotoUri, originalData]);


    // TODO: change this to whatever toast/alert method we're using
    /*async function handleConfirmPhoneNumber(userAttributeKey, confirmationCode) {
        try {
            await confirmUserAttribute({ userAttributeKey, confirmationCode });
            setMessage("Phone number confirmation successful");
            setNeedsPhoneConfirmation(false);
            setConfirmationCode("");
        } catch (error) {
            console.log("Error confirming user attribute:", error);
            setMessage(`Error confirming phone number: ${error.message}`);
        }
    }*/

    async function handleUpdate() {
        setMessage("");
        setUpdating(true);
        
        const digitsOnlyPhone = (phoneNumber || '').replace(/\D/g, '');
        const newErrors = {
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
            // Optional phone; if provided validate 4-15 digits per E.164
            phoneNumber: !!phoneNumber && (digitsOnlyPhone.length < 4 || digitsOnlyPhone.length > 15),
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) {
            setUpdating(false);
            return;
        }
        
        try {
            const updateData = {};

            if (firstName.trim() !== originalData.firstName) {
                updateData.given_name = firstName.trim();
            }

            if (lastName.trim() !== originalData.lastName) {
                updateData.family_name = lastName.trim();
            }

            if (phoneNumber.trim() !== originalData.phoneNumber || callingCode !== originalData.callingCode) {
                const digits = (phoneNumber || '').replace(/\D/g, '');
                updateData.phone_number = digits ? `+${callingCode}${digits}` : '';
            }

            if (photoChanged) {
                if (profilePhotoUri) {
                    const s3Url = await uploadProfilePhotoToS3(profilePhotoUri);
                    updateData.picture = s3Url;
                } else {
                    updateData.picture = "";
                    await removeProfilePhotoFromLocalStorage();
                }
            }

            // if there are no changed fields don't send anything
            if (Object.keys(updateData).length === 0) {
                setMessage("There are no changed fields to update");
                setUpdating(false);
                return;
            }

            let workspaceId = await getWorkspaceId();
            let { userId } = await getCurrentUser();
            
            const result = await apiPut(
                endpoints.user.core.updateUser(userId, workspaceId),
                updateData
            );

            console.log(result);

            setOriginalData({
                firstName,
                lastName,
                phoneNumber,
                callingCode,
                profilePhotoUri
            });
            setPhotoChanged(false);
            setMessage("Personal details updated successfully");

        } catch (error) {
            console.log("Error updating personal details: ", error);
            setMessage(`Error updating personal details: ${error.message}`);
        }

        setUpdating(false);
    }

    // handle phone confirmation code
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

    return(
        <View style={commonStyles.screen}>
            <Header title="Personal Details" showBack onBackPress={handleBackPress}/>
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
                                if (text.trim()) setErrors((prev) => ({ ...prev, firstName: false }));
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
                                if (text.trim()) setErrors((prev) => ({ ...prev, lastName: false }));
                            }}
                        />
                        {errors.lastName && (
                            <Text style={{ color: theme.colors.error }}>Please enter your last name</Text>
                        )}

                        <View>
                            <Text style={{ marginBottom: 6, color: theme.colors.text }}>Country Code</Text>
                            <CountryPicker
                                countryCode={countryCca2}
                                withFilter
                                withFlag
                                withCountryNameButton
                                withCallingCode
                                withDarkTheme={!!theme.dark}
                                theme={{
                                    onBackgroundTextColor: theme.colors.text,
                                    backgroundColor: theme.colors.background,
                                    primaryColor: theme.colors.primary,
                                    primaryColorVariant: theme.colors.primary,
                                }}
                                onSelect={(country) => {
                                    setCountryCca2(country.cca2);
                                    const code = (country.callingCode && country.callingCode[0]) || '';
                                    if (code) setCallingCode(code);
                                }}
                            />
                            <Text style={{ marginTop: 6, opacity: 0.7, color: theme.colors.text }}>Selected calling code: +{callingCode}</Text>
                        </View>

                        <TextField 
                            label="Phone Number (Optional)"
                            value={phoneNumber}
                            placeholder="Phone Number"
                            maxLength={15}
                            keyboardType="numeric"
                            textContentType="telephoneNumber"
                            onChangeText={(text) => {
                                setPhoneNumber(text);
                                const digits = text.replace(/\D/g, '');
                                if (digits.length >= 4 && digits.length <= 15) setErrors((prev) => ({ ...prev, phoneNumber: false }));
                            }}
                        />
                        {errors.phoneNumber && (
                            <Text style={{ color: theme.colors.error }}>Phone number must be 4-15 digits</Text>
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

                    <View style={commonStyles.inlineButtonContainer}>
                        <BasicButton 
                            label={updating ? "Updating..." : "Update"} 
                            onPress={handleUpdate}
                            disabled={updating}
                        />
                    </View>

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
                </View>
            )}

            <UnsavedChangesDialog
                visible={showUnsavedDialog}
                onDismiss={() => setShowUnsavedDialog(false)}
                handleLeftAction={handleDiscardChanges}
                handleRightAction={() => setShowUnsavedDialog(false)}
            />
        </View> 
    )
}

export default PersonalDetails;