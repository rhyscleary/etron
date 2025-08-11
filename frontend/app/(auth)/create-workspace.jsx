// Author(s): Rhys Cleary

import { View } from "react-native";
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import { useRouter } from "expo-router";
import { useState } from "react";
import BasicButton from "../../components/common/buttons/BasicButton";
import TextField from "../../components/common/input/TextField";
import StackLayout from "../../components/layout/StackLayout";

import { Snackbar, Text, useTheme } from "react-native-paper";
import { apiPost } from "../../utils/api/apiClient";
import MessageBar from "../../components/overlays/MessageBar";
import endpoints from "../../utils/api/endpoints";
import { saveWorkspaceInfo } from "../../storage/workspaceStorage";

const CreateWorkspace = () => {
    const router = useRouter();
    const theme = useTheme();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [nameError, setNameError] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    async function handleCreate() {

        if (!name.trim()) {
            setNameError(true);
            return;
        }

        try {
            const workspaceData = {
                name,
                location: location || null,
                description: description || null
            }

            const result = await apiPost(
                endpoints.workspace.core.create,
                workspaceData
            );

            // save workspace info to local storage
            saveWorkspaceInfo(result);

            console.log('Workspace creation response:', result);


            // navigate to the profile
            router.push("/profile");
        } catch (error) {
            console.log("Error creating workspace: ", error);
            setSnackbarVisible(true)
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
                                    setNameError(false);
                                }
                            }} 
                        />
                        {nameError && (
                            <Text style={{color: theme.colors.error}}>Please enter a name.</Text>
                        )}
                    </View>
                    <TextField label="Location (Optional)" value={location} placeholder="Location" onChangeText={setLocation} />
                    <TextField label="Description (Optional)" value={description} placeholder="Description" onChangeText={setDescription} />
                </StackLayout>

                <View style={commonStyles.inlineButtonContainer}>
                    <BasicButton label="Create" onPress={handleCreate} disabled={!name.trim()} />
                </View>
            </View>

            <MessageBar 
                visible={snackbarVisible} 
                message="An error has occured. Please try again."
                onDismiss={() => setSnackbarVisible(false)} 
            />
        </View>
    )
}

export default CreateWorkspace;