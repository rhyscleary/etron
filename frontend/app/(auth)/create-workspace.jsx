// Author(s): Rhys Cleary

import { View } from "react-native";
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import { useRouter } from "expo-router";
import { useState } from "react";
import BasicButton from "../../components/common/buttons/BasicButton";
import TextField from "../../components/common/input/TextField";
import StackLayout from "../../components/layout/StackLayout";
import { Text, useTheme } from "react-native-paper";
import { apiPost } from "../../utils/api/apiClient";
import endpoints from "../../utils/api/endpoints";
import { saveWorkspaceInfo } from "../../storage/workspaceStorage";
import { updateUserAttribute } from "aws-amplify/auth";

const CreateWorkspace = () => {
    const router = useRouter();
    const theme = useTheme();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState(false);
    const [creating, setCreating] = useState(false);

    // updates user attributes in cognito
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
                    console.log(`Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium} at ${codeDeliveryDetails?.destination}`);
                    return { needsConfirmation: true };
                case 'DONE':
                    const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    console.log(`${fieldName} updated successfully`);
                    return { needsConfirmation: false };
                default:
                    console.log(`${attributeKey.replace('_', ' ')} update completed`);
                    return { needsConfirmation: false };
            }
        } catch (error) {
            console.log("Error updating user attribute:", error);
            const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            setMessage(`Error updating ${fieldName}: ${error.message}`);
            return { needsConfirmation: false, error: true };
        }
    }

    async function handleCreate() {
        setCreating(true);

        const newErrors = {
            name: !name.trim(),
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) {
            setCreating(false);
            return;
        }

        try {
            const workspaceData = {
                name: name.trim(),
                location: location.trim() || null,
                description: description.trim() || null
            }

            const result = await apiPost(
                endpoints.workspace.core.create,
                workspaceData
            );

            // save workspace info to local storage
            saveWorkspaceInfo(result);

            // update user attribute to be in a workspace
            await handleUpdateUserAttribute('custom:has_workspace', "true");

            console.log('Workspace creation response:', result);
            setCreating(false);


            // navigate to the profile
            router.push("/profile");
        } catch (error) {
            setCreating(false);
            console.log("Error creating workspace: ", error);
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Header title="Create Workspace" showBack />

            <View>
                <StackLayout spacing={30}> 
                    <View>
                        <TextField 
                            label="Name" 
                            value={name} 
                            placeholder="Name" 
                            onChangeText={(text) => {
                                setName(text);
                                if (text.trim()) {
                                    setErrors((prev) => ({...prev, name: false}))
                                }
                            }} 
                        />
                        {errors.name && (
                            <Text style={{color: theme.colors.error}}>Please enter a name.</Text>
                        )}
                    </View>
                    <TextField label="Location (Optional)" value={location} placeholder="Location" onChangeText={setLocation} />
                    <TextField label="Description (Optional)" value={description} placeholder="Description" onChangeText={setDescription} />
                </StackLayout>

                <View style={commonStyles.inlineButtonContainer}>
                    <BasicButton 
                        label={creating ? "Creating..." : "Create"} 
                        onPress={handleCreate}
                        disabled={creating} 
                    />
                </View>
            </View>
        </View>
    )
}

export default CreateWorkspace;