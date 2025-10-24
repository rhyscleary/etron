// Author(s): Holly Wyatt, Noah Bradley, Rhys Cleary

import { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, Keyboard } from "react-native";
import { Text, useTheme, Snackbar, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../../../components/layout/Header";
import StackLayout from "../../../../components/layout/StackLayout";
import TextField from "../../../../components/common/input/TextField";
import BasicButton from "../../../../components/common/buttons/BasicButton";
import AvatarButton from "../../../../components/common/buttons/AvatarButton";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { apiPut } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import { router } from "expo-router";
import {
  fetchUserAttributes,
  getCurrentUser,
} from "aws-amplify/auth";
import {
  loadProfilePhoto,
  removeProfilePhotoFromLocalStorage,
  getPhotoFromDevice,
  saveProfilePhoto,
} from "../../../../utils/profilePhoto";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import UnsavedChangesDialog from "../../../../components/overlays/UnsavedChangesDialog";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";

global.Buffer = global.Buffer || Buffer

const PersonalDetails = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [profilePhotoUri, setProfilePhotoUri] = useState(null);

    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    const [photoChanged, setPhotoChanged] = useState(false);
    const [originalData, setOriginalData] = useState({});

    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        phoneNumber: false,
    })

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    const [snack, setSnack] = useState({
        visible: false,
        text: "",
    });

    useEffect(() => {
        loadProfileData();
    }, []);

    async function loadProfileData() {
        setLoading(true);
        try {
            const userAttributes = await fetchUserAttributes();
            
            const given = userAttributes.given_name || "";
            const family = userAttributes.family_name || "";
            const rawPhone = userAttributes.phone_number || "";
            const cleanPhone = rawPhone.startsWith("+61") ? rawPhone.substring(3) : rawPhone;

            const photo = await loadProfilePhoto();
            
            setFirstName(given);
            setLastName(family);
            setPhoneNumber(cleanPhone);
            setProfilePhotoUri(photo || null);

            setOriginalData({
                firstName: given,
                lastName: family,
                phoneNumber: cleanPhone,
                profilePhotoUri: photo || null,
            });
        } catch (error) {
            console.error("Error loading personal details: ", error);
            setSnack({ visible:true, text:"Error loading personal details"});
        } finally {
            setLoading(false);
        }
    }

    // Function for uploading photo to S3
    const handleUploadPhoto = async () => {
        try {
            const newUri = await getPhotoFromDevice();
            setProfilePhotoUri(newUri);
            setPhotoChanged(true);
        } catch (error) {
            console.error("Error uploading photo s3:", error.message);
            setSnack({ visible: true, text: "Could not pick a photo" });
        }
    };

    const handleRemovePhoto = () => {
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

    const phoneValid = !phoneNumber || (phoneNumber.length >= 9 && phoneNumber.length <= 10);

    const canSave = useMemo(() => {
        const requiredOk = firstName.trim().length > 0 && lastName.trim().length > 0;
        return !updating && hasUnsavedChanges && requiredOk && phoneValid;
    }, [updating, hasUnsavedChanges, firstName, lastName, phoneValid]);

    async function handleUpdate() {
        Keyboard.dismiss();

        const newErrors = {
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
            phoneNumber: !phoneValid,
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) {
            setSnack({ visible: true, text: "Please fix the highlighted fields" });
            return;
        }
        
        setUpdating(true);
        try {
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

            if (Object.keys(updateData).length === 0) {
                setSnack({ visible: true, text: "No changes to update" });
                setUpdating(false);
                return;
            }

            let workspaceId = await getWorkspaceId();
            let { userId } = await getCurrentUser();
            
            await apiPut(endpoints.user.core.updateUser(userId, workspaceId), updateData);

            setOriginalData({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                profilePhotoUri,
            });
            setPhotoChanged(false);
            setSnack({ visible: true, text: "Personal details updated" });
        } catch (error) {
            console.error("Error updating personal details: ", error);
            setSnack({ visible: true, text: "Update failed" });
        } finally {
            setUpdating(false);
        }
    }

    function handleBackPress() {
        if (hasUnsavedChanges) setShowUnsavedDialog(true);
        else router.back();
    }

    function handleDiscardChanges() {
        setShowUnsavedDialog(false);
        router.back();
    }

    return (
        <ResponsiveScreen
            header = {<Header
                title="Personal Details"
                showBack
                showCheck={canSave}
                onBackPress={handleBackPress}
                onRightIconPress={handleUpdate}
            />}
            center={false}
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
                        <BasicButton label="Remove Photo" mode="outlined" onPress={handleRemovePhoto} />

                        <TextField 
                            label="First Name"
                            value={firstName}
                            placeholder="First Name"
                            textContentType="givenName"
                            error={errors.firstName}
                            onChangeText={(text) => {
                                setFirstName(text);
                                if (text.trim()) setErrors((prev) => ({ ...prev, first: false }));
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
                            error={errors.lastName}
                            onChangeText={(text) => {
                                setLastName(text);
                                if (text.trim()) setErrors((prev) => ({ ...prev, last: false }));
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
                            error={errors.phoneNumber}
                            onChangeText={(text) => {
                                setPhoneNumber(text);
                                if (text.length >= 9 && text.length <= 10) setErrors((prev) => ({ ...prev, phoneNumber: false }));
                            }}
                        />
                        {errors.phoneNumber && (
                            <Text style={{ color: theme.colors.error }}>Phone number must be 9-10 digits</Text>
                        )}
                    </StackLayout>
                </View>
            )}

            <Portal>
                <Snackbar
                    visible={snack.visible}
                    onDismiss={() => setSnack((s) => ({ ...s, visible: false }))}
                    duration={2200}
                    wrapperStyle={{
                        bottom: (insets?.bottom ?? 0) + 12,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    style={{
                        alignSelf: "center",
                        maxWidth: 520,
                        width: "90%",
                    }}
                >
                    {snack.text}
                </Snackbar>

                {updating && (
                    <View
                        pointerEvents="auto"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.25)",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                        }}
                    >
                        <ActivityIndicator size="large" />
                    </View>
                )}
            </Portal>

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