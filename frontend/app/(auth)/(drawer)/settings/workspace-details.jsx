// Author(s): Rhys Cleary

import { ActivityIndicator, StyleSheet, View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../../../components/common/buttons/DescriptiveButton";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import StackLayout from "../../../../components/layout/StackLayout";
import { Text, useTheme } from "react-native-paper";
import { apiGet, apiPut } from "../../../../utils/api/apiClient";
import BasicButton from "../../../../components/common/buttons/BasicButton";
import TextField from "../../../../components/common/input/TextField";
import { getWorkspaceId, getWorkspaceInfo, saveWorkspaceInfo } from "../../../../storage/workspaceStorage";
import endpoints from "../../../../utils/api/endpoints";
import UnsavedChangesDialog from "../../../../components/overlays/UnsavedChangesDialog";


const WorkspaceDetails = () => {
    const theme = useTheme();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    useEffect(() => {
        async function loadWorkspaceDetails() {
            setLoading(true);
            try {
                const workspaceId = await getWorkspaceId();

                const workspace = await apiGet(
                    endpoints.workspace.core.getWorkspace(workspaceId)
                );

                if (workspace) {
                    // set values for workspace details
                    setName(workspace.name || "");
                    setDescription(workspace.description || "");
                    setLocation(workspace.location || "");

                    // set original values 
                    setOriginalData({
                        name: workspace.name || "",
                        location: workspace.location || "",
                        description: workspace.description || ""
                    });
                }
            } catch (error) {
                console.log("Error loading workspace details: ", error);
            }
            setLoading(false);
        }
        loadWorkspaceDetails();
    }, []);

    useEffect(() => {
        const changed =
            name.trim() !== originalData.name ||
            location.trim() !== originalData.location ||
            description.trim() !== originalData.description;
        setHasUnsavedChanges(changed);
    }, [name, location, description]);

    async function handleUpdate() {
        setUpdating(true);

        const newErrors = {
            name: !name.trim(),
        };
        setErrors(newErrors);
        
        if (Object.values(newErrors).some(Boolean)) {
            setUpdating(false);
            return;
        }

        try {
            // get workspace id from local storage
            const workspaceId = await getWorkspaceId();

            const workspaceData = {
                name: name.trim(),
                location: location.trim() || null,
                description: description.trim() || null
            }

            const result = await apiPut(
                endpoints.workspace.core.update(workspaceId),
                workspaceData
            );

            console.log('Workspace details updated:', result);
            
            setOriginalData({
                name,
                location,
                description
            });

        } catch (error) {
            setUpdating(false);
            console.log("Error updating workspace details: ", error);
        }

        setUpdating(false);
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
        <View style={commonStyles.screen}>
            <Header title="Workspace Details" showBack onBackPress={handleBackPress}/>

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <View>
                        <StackLayout spacing={30}> 
                            <TextField 
                                label="Name" 
                                value={name} 
                                placeholder="Name"
                                error={errors.name}
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

                            <TextField label="Location (Optional)" value={location} placeholder="Location" onChangeText={setLocation} />
                            <TextField label="Description (Optional)" value={description} placeholder="Description" onChangeText={setDescription} />
                        </StackLayout>

                        <View style={commonStyles.inlineButtonContainer}>
                            <BasicButton 
                                label={updating ? "Updating..." : "Update"}
                                onPress={handleUpdate}
                                disabled={updating} 
                            />
                        </View>
                    </View>
                )}
            </View>

            <UnsavedChangesDialog
                visible={showUnsavedDialog}
                onDismiss={() => setShowUnsavedDialog(false)}
                handleLeftAction={handleDiscardChanges}
                handleRightAction={() => setShowUnsavedDialog(false)}
            />
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