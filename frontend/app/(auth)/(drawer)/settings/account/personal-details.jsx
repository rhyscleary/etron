import { useEffect, useState } from "react";
import { ActivityIndicator, View } from 'react-native'
import { commonStyles } from '../../../../../assets/styles/stylesheets/common';
import Header from '../../../../../components/layout/Header';
import StackLayout from "../../../../../components/layout/StackLayout";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import { Text, useTheme } from "react-native-paper";

import {
    fetchUserAttributes,
    updateUserAttribute,
    confirmUserAttribute
} from 'aws-amplify/auth';

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
    const [errors, setErrors] = useState({
        first: false,
        last: false,
        phone: false,
    });

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
        </View>
    )
}

export default PersonalDetails;