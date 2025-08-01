// Author(s): Rhys Cleary

import { ActivityIndicator, StyleSheet, View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../components/common/buttons/DescriptiveButton";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import StackLayout from "../../../../components/layout/StackLayout";
import { Text, useTheme } from "react-native-paper";
import { apiPut } from "../../../../utils/api/apiClient";
import BasicButton from "../../../../components/common/buttons/BasicButton";
import TextField from "../../../../components/common/input/TextField";
import { getWorkspaceId, getWorkspaceInfo } from "../../../../storage/workspaceStorage";


const WorkspaceDetails = () => {
    const theme = useTheme();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [nameError, setNameError] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadWorkspaceDetails() {
            setLoading(true);
            try {
                const workspace = await getWorkspaceInfo();
                if (workspace) {
                    // set values for workspace details
                    setName(workspace.name || "");
                    setDescription(workspace.description || "");
                    setLocation(workspace.location || "");
                }
            } catch (error) {
                console.log("Error loading workspace details: ", error);
            }
            setLoading(false);
        }
        loadWorkspaceDetails();
    }, []);

    async function handleUpdate() {
    
        if (!name.trim()) {
            setNameError(true);
            return;
        }

        try {
            // get workspace id from local storage
            const workspaceId = await getWorkspaceId();

            const workspaceData = {
                name,
                location: location || null,
                description: description || null
            }

            const result = await apiPut(
                `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}`,
                workspaceData
            );

            console.log('Workspace details updated:', result);

        } catch (error) {
            console.log("Error updating workspace details: ", error);
        }
    }

    return (
        <View style={commonStyles.screen}>
            <Header title="Workspace Details" showBack />

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <View>
                        <StackLayout spacing={30}> 
                            <TextField 
                                label="Name *" 
                                value={name} 
                                placeholder="Name"
                                error={nameError}
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
                            <TextField label="Location (Optional)" value={location} placeholder="Location" onChangeText={setLocation} />
                            <TextField label="Description (Optional)" value={description} placeholder="Description" onChangeText={setDescription} />
                        </StackLayout>

                        <View style={commonStyles.inlineButtonContainer}>
                            <BasicButton label="Save" onPress={handleUpdate} />
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default WorkspaceDetails;