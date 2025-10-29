// Author(s): Rhys Cleary, Noah Bradley

import { ActivityIndicator, StyleSheet, View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { Card, List, Text, useTheme } from "react-native-paper";
import { useEffect, useState, useCallback } from "react";
import StackLayout from "../../../../../components/layout/StackLayout";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import { apiGet } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { router } from "expo-router";
import formatDateTime from "../../../../../utils/format/formatISODate";
import { hasPermission } from "../../../../../utils/permissions";
import { useFocusEffect } from "expo-router";


const WorkspaceDetails = () => {
    const theme = useTheme();

    const [workspace, setWorkspace] = useState();
    const [loading, setLoading] = useState(false);
    const [editWorkspacePermission, setEditWorkspacePermission] = useState(false);

    /*useEffect(() => {
        loadWorkspaceDetails();
    }, []);*/

    const loadWorkspaceDetails = useCallback(async () => {
        setLoading(true);

        const editWorkspacePermission = await hasPermission("app.workspace.update_workspace")
        setEditWorkspacePermission(editWorkspacePermission);
        
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
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadWorkspaceDetails();
        }, [loadWorkspaceDetails])
    );

    return (
		<ResponsiveScreen
			header={<Header
                title="Workspace Details"
                showBack
                showEdit
                onRightIconPress={() => router.navigate("settings/workspace/edit-workspace-details")}
                rightIconPermission={editWorkspacePermission}
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