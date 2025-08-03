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

import {
    fetchUserAttributes,
    updateUserAttribute,
    confirmUserAttribute,
    getCurrentUser
} from 'aws-amplify/auth';

global.Buffer = global.Buffer || Buffer

const PersonalDetails = () => {
    const theme = useTheme();

    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");
    const [needsPhoneConfirmation, setNeedsPhoneConfirmation] = useState(false);
    const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);
    const [profilePhotoUri, setProfilePhotoUri] = useState(null);
    const [errors, setErrors] = useState({
        first: false,
        last: false,
        phone: false,
    });

    // Function to load the profile photo URL
    const loadProfilePhoto = async () => {
        try {
            // Load the photo from local storage if possible
            console.log("Fetching from local storage...");
            const cachedUri = await AsyncStorage.getItem('profilePhotoUri');
            if (cachedUri) {
                setProfilePhotoUri(cachedUri);
                console.log("Profile photo loaded from cache.");
                return;
            }

            // If not in local storage, then get from S3
            console.log("Fetching from S3...")
            const userAttributes = await fetchUserAttributes();
            const S3Url = userAttributes.picture;
            if (!S3Url) {
                console.log("Profile photo URL not found.");
                return;
            }
            const S3UrlResult = await getUrl({path: S3Url});
            await AsyncStorage.setItem('profilePhotoUri', S3UrlResult.url.toString())
            setProfilePhotoUri(S3UrlResult.url.toString());
            console.log("New profile photo URL fetched and cached.");
        } catch (error) {
            console.log("Profile photo URL fetch unsuccessful:", error);
        } finally {
            setIsLoadingPhoto(false);
        }
    }
    
    useEffect(() => {
        loadProfilePhoto();
    }, [])

    // Function for uploading photo to S3
    const handleUploadPhoto = async () => {
        // Get photo library access permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            console.log("Photo picking failed: Photo access was denied.");
            Alert.alert("Permission to access photos is required.");
            return;
        }

        // Open photo library and get user to pick photo
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],  // Forces user to crop image to a square
            quality: 0.1, 
        });
        if (result.canceled) {
            console.log("Photo picking failed: User cancelled image picker.");
            return;
        }
        setIsLoadingPhoto(true);

        // Get the selected photo URI from the device 
        const asset = result.assets[0];
        const localUri = asset.uri;
        console.log("Local URI of photo obtained.");
        
        // Get the destination S3 path
        const { userId } = await getCurrentUser();
        const fileName = `${userId}/${Date.now()}.jpg`;
        const S3FilePath = `public/${fileName}`;
        console.log("S3 file path created.")

        // Upload the photo to S3
        console.log("Uploading photo to S3 bucket...")
        try {
            const fileBuffer = await FileSystem.readAsStringAsync(localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const result = await uploadData({
                path: S3FilePath,
                data: Buffer.from(fileBuffer, 'base64')
            }).result;
            console.log("Photo uploaded successfully.");
        } catch (error) {
            console.log("Error uploading photo:", error);
            setIsLoadingPhoto(false);
            return;
        }

        // Update the S3 path in the user's details
        try {
            const output = await updateUserAttribute({
                userAttribute: {
                    attributeKey: 'picture',
                    value: S3FilePath
                }
            });

            console.log("User details profile picture URL updated.");
            await AsyncStorage.removeItem("profilePhotoUri");
            await loadProfilePhoto();
        } catch (error) {
            console.log("Profile picture URL upload to user details unsuccessful:", error);
            setIsLoadingPhoto(false);
            return;
        }
    }

    useEffect(() => {
        loadPersonalDetails();
    }, []);

    async function loadPersonalDetails() {
        setLoading(true);
        try {
            const userAttributes = await fetchUserAttributes();
            console.log("User Attributes:", userAttributes);
            
            setFirst(userAttributes.given_name || "");
            setLast(userAttributes.family_name || "");
            // remove country code from phone number
            const phoneNumber = userAttributes.phone_number || "";
            const cleanPhone = phoneNumber.startsWith('+61') ? 
                phoneNumber.substring(3) : phoneNumber;
            setPhone(cleanPhone);
            
        } catch (error) {
            console.log("Error loading personal details: ", error);
            setMessage("Error loading personal details");
        }
        setLoading(false);
    }
    // updates user details, including verification code if needed (shouldn't be) 
    async function handleUpdateUserAttribute(attributeKey, value) {
        try {
            const output = await updateUserAttribute({
                userAttribute: {
                    attributeKey,
                    value
                }
            });

            const { nextStep } = output;

            switch (nextStep.updateAttributeStep) {
                case 'CONFIRM_ATTRIBUTE_WITH_CODE':
                    const codeDeliveryDetails = nextStep.codeDeliveryDetails;
                    setMessage(`Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium} at ${codeDeliveryDetails?.destination}`);
                    if (attributeKey === 'phone_number') {
                        setNeedsPhoneConfirmation(true);
                    }
                    return { needsConfirmation: true };
                case 'DONE':
                    const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    setMessage(`${fieldName} updated successfully`);
                    return { needsConfirmation: false };
                default:
                    setMessage(`${attributeKey.replace('_', ' ')} update completed`);
                    return { needsConfirmation: false };
            }
        } catch (error) {
            console.log("Error updating user attribute:", error);
            const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            setMessage(`Error updating ${fieldName}: ${error.message}`);
            return { needsConfirmation: false, error: true };
        }
    }

    // TODO: change this to whatever toast/alert method we're using
    async function handleConfirmUserAttribute(userAttributeKey, confirmationCode) {
        try {
            await confirmUserAttribute({ userAttributeKey, confirmationCode });
            setMessage("Phone number confirmation successful");
            setNeedsPhoneConfirmation(false);
            setConfirmationCode("");
        } catch (error) {
            console.log("Error confirming user attribute:", error);
            setMessage(`Error confirming phone number: ${error.message}`);
        }
    }

    async function handleUpdate() {
        setMessage("");
        
        const newErrors = {
            first: !first.trim(),
            last: !last.trim(),
            phone: phone && (phone.length < 9 || phone.length > 10),
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) {
            return;
        }

        setUpdating(true);
        
        try {
            // get current attributes to compare and update
            const currentAttributes = await fetchUserAttributes();
            let allUpdatesSuccessful = true;
            let hasUpdates = false;
            
            // update first name if changed
            if (first.trim() !== (currentAttributes.given_name || "")) {
                hasUpdates = true;
                const result = await handleUpdateUserAttribute('given_name', first.trim());
                if (result.error) allUpdatesSuccessful = false;
            }

            // update last name if changed
            if (last.trim() !== (currentAttributes.family_name || "")) {
                hasUpdates = true;
                const result = await handleUpdateUserAttribute('family_name', last.trim());
                if (result.error) allUpdatesSuccessful = false;
            }

            // update phone number if changed
            if (phone.trim()) {
                // adds country code for australia (do we need to handle other countries?)
                const formattedPhone = phone.startsWith('+61') ? phone : `+61${phone}`;
                const currentPhone = currentAttributes.phone_number || "";
                const currentCleanPhone = currentPhone.startsWith('+61') ? 
                    currentPhone.substring(3) : currentPhone;
                
                if (phone.trim() !== currentCleanPhone) {
                    hasUpdates = true;
                    const result = await handleUpdateUserAttribute('phone_number', formattedPhone);
                    if (result.error) allUpdatesSuccessful = false;
                }
            }

            // show feedback message
            if (!message && hasUpdates && allUpdatesSuccessful) {
                if (!needsPhoneConfirmation) {
                    setMessage("All personal details updated successfully");
                }
            } else if (!hasUpdates) {
                setMessage("No changes detected");
            }

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
        
        await handleConfirmUserAttribute("phone_number", confirmationCode);
    }

    return(
        <View style={commonStyles.screen}>
            <Header title="Personal Details" showBack></Header>
            { loading ? (
                <View style={commonStyles.centeredContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <View>
                    <StackLayout spacing={34}>
                        <TextField 
                            label="First Name"
                            value={first}
                            placeholder="Jane"
                            textContentType="givenName"
                            onChangeText={(text) => {
                                setFirst(text);
                                if (text.trim()) {
                                    setErrors((prev) => ({ ...prev, first: false }));
                                }
                            }}
                        />
                        {errors.first && (
                            <Text style={{ color: theme.colors.error }}>Please enter your first name</Text>
                        )}

                        <TextField 
                            label="Last Name"
                            value={last}
                            textContentType="familyName"
                            placeholder="Doe"
                            onChangeText={(text) => {
                                setLast(text);
                                if (text.trim()) {
                                    setErrors((prev) => ({ ...prev, last: false }));
                                }
                            }}
                        />
                        {errors.last && (
                            <Text style={{ color: theme.colors.error }}>Please enter your last name</Text>
                        )}

                        <TextField 
                            label="Phone Number (Optional)"
                            value={phone}
                            placeholder="412345678"
                            maxLength={10}
                            keyboardType="numeric"
                            textContentType="telephoneNumber"
                            onChangeText={(text) => {
                                setPhone(text);
                                if (text.length >= 9 && text.length <= 10) {
                                    setErrors((prev) => ({ ...prev, phone: false }));
                                }
                            }}
                        />
                        {errors.phone && (
                            <Text style={{ color: theme.colors.error }}>Phone number must be 9-10 digits</Text>
                        )}

                        {needsPhoneConfirmation && (
                            <>
                                <TextField 
                                    label="Phone Confirmation Code"
                                    value={confirmationCode}
                                    placeholder="123456"
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
            <View style={commonStyles.screen}>
                <Button title="Choose and upload photo" onPress={handleUploadPhoto} />
                { isLoadingPhoto ? (
                    <ActivityIndicator />
                ) : (
                    <Image
                        source={{ uri:profilePhotoUri }}
                        style={{ width: 100, height: 100, borderRadius: 50 }}
                        placeholder = {"Profile photo goes here"}
                    />
                )}
            </View>
        </View> 
    )
}

export default PersonalDetails;