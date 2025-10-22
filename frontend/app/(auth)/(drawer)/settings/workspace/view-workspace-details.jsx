// Author(s): Rhys Cleary, Noah Bradley

import { ActivityIndicator, StyleSheet, View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { Card, List, Text, useTheme } from "react-native-paper";
import { useEffect, useState } from "react";
import StackLayout from "../../../../../components/layout/StackLayout";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import { apiGet } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { router } from "expo-router";
import formatDateTime from "../../../../../utils/format/formatISODate";


const WorkspaceDetails = () => {
    const theme = useTheme();

    const [name, setName] = useState("");
    const [workspace, setWorkspace] = useState();
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    /*useEffect(() => {
        async function loadWorkspaceDetails() {
            setLoading(true);
            try {
                const workspaceId = await getWorkspaceId();

                const result = await apiGet(endpoints.workspace.core.getWorkspace(workspaceId));
                const workspace = result.data;

                console.log("Workspace:", workspace);

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
                console.error("Error loading workspace details: ", error);
            }
            setLoading(false);
        }
        loadWorkspaceDetails();
    }, []);*/

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const workspaceId = await getWorkspaceId();
                const result = await apiGet(endpoints.workspace.core.getWorkspace(workspaceId));
                setWorkspace(result.data);
            } catch (error) {
                console.error("Error loading workspace details:", error);
                setWorkspace(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /*useEffect(() => {
        const changed =
            name.trim() !== originalData.name ||
            location.trim() !== originalData.location ||
            description.trim() !== originalData.description;
        setHasUnsavedChanges(changed);
    }, [name, location, description, originalData]);

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
            const updateData = {};

            if (name.trim() !== originalData.name) {
                updateData.name = name.trim();
            }

            if (location.trim() !== originalData.location) {
                updateData.location = location.trim();
            }

            if (description.trim() !== originalData.description) {
                updateData.description = description.trim();
            }

            // get workspace id from local storage
            const workspaceId = await getWorkspaceId();

            const result = await apiPatch(
                endpoints.workspace.core.update(workspaceId),
                updateData
            );

            console.log('Workspace details updated:', result.data);
            
            setOriginalData({
                name,
                location,
                description
            });

        } catch (error) {
            setUpdating(false);
            console.error("Error updating workspace details: ", error);
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
    }*/

    return (
		<ResponsiveScreen
			header={<Header
                title="Workspace Details"
                showBack
                showEdit
                onRightIconPress={() => router.navigate("settings/workspace/edit-workspace-details")}
            />}
			center={false}
			padded
		>
            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                        <Text>Loading details...</Text>
                    </View>
                ) : !workspace ? (
                    <View style={styles.loadingContainer}>
                        <Text>Workspace not found.</Text>
                    </View>
                ) : (
                    <StackLayout spacing={16}>
                        <Card>
                            <Card.Content>
                                <List.Section>
                                    <List.Item
                                        title={workspace.name || "-"}
                                    />
                                    <List.Item
                                        title="Location"
                                        description={workspace.location || "-"}
                                    />
                                    <List.Item
                                        title="Description"
                                        description={workspace.description || "-"}
                                        descriptionNumberOfLines={5}
                                    />
                                </List.Section>
                            </Card.Content>
                        </Card>
                        <Card>
                            <Card.Content>
                                <List.Section>
                                    <List.Item
                                        title="Created"
                                        description={workspace.createdAt ? formatDateTime(workspace.createdAt) : "—"}
                                    />
                                    <List.Item
                                        title="Last Updated"
                                        description={workspace.updatedAt ? formatDateTime(workspace.updatedAt) : "—"}
                                    />
                                </List.Section>
                            </Card.Content>
                        </Card>
                    </StackLayout>
                )}
            </View>
        </ResponsiveScreen>
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
    },
        nameTitle: {
        fontWeight: "700",
        marginBottom: 8,
    },
})

export default WorkspaceDetails;