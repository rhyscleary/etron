// Author(s): Noah Bradley

import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import Header from "../../../../../components/layout/Header";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { apiGet } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { ActivityIndicator, Card, Chip, Divider, List, Text, useTheme, Button, } from "react-native-paper";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import formatDateTime from "../../../../../utils/format/formatISODate";
import ItemNotFound from "../../../../../components/common/errors/MissingItem";
import StackLayout from "../../../../../components/layout/StackLayout";

function groupPermissions(permissions = []) {
    const buckets = {
        "Workspace": [],
        "Collaboration": [],
        "Day Book - Data Sources": [],
        "Day Book - Metrics": [],
        "Day Book - Reports": [],
        "Other": [],
    };

    for (const permission of permissions) {
        if (permission.startsWith("app.workspace.")) buckets["Workspace"].push(permission);
        else if (permission.startsWith("app.collaboration.")) buckets["Collaboration"].push(permission);
        else if (permission.startsWith("modules.daybook.datasources.")) buckets["Day Book - Data Sources"].push(permission);
        else if (permission.startsWith("modules.daybook.metrics.")) buckets["Day Book - Metrics"].push(permission);
        else if (permission.startsWith("modules.daybook.reports.")) buckets["Day Book - Reports"].push(permission);
        else buckets["Other"].push(permission);
    }

    return Object.entries(buckets);
}

export default function ViewRole() {
    const { roleId } = useLocalSearchParams();
    const theme = useTheme();

    const [workspaceId, setWorkspaceId] = useState(null);
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [roleExists, setRoleExists] = useState(true);

    const loadRole = useCallback(async () => {
        try {
            const workspaceId = await getWorkspaceId();
            setWorkspaceId(workspaceId);

            const result = await apiGet(endpoints.workspace.roles.getRole(workspaceId, roleId));
            const role = result.data;
            console.log("Role:", role);

            if (!role) setRoleExists(false)
            else setRole(role);
        } catch (error) {
            console.error("Error fetching role:", error);
            setRoleExists(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [roleId])

    useEffect(() => {
        setLoading(true);
        loadRole();
    }, [loadRole]);

    const groupedPermissions = useMemo(() => groupPermissions(role?.permissions), [role]);

    useFocusEffect(
        useCallback(() => {
            loadRole();
        }, [loadRole])
    );

    return (
        <ResponsiveScreen
            header={
                <Header
                    title="View Role"
                    showEdit={!loading && roleExists}
                    showBack
                    onRightIconPress={() => router.navigate(`/collaboration/edit-role/${roleId}`)}
                />
            }
            center={!roleExists}
        >
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" />
                </View>
            ) : roleExists ? (<StackLayout spacing={16}>
                <Card>
                    <Card.Title title={role.name} />
                    <List.Item
                        title="Created"
                        description={formatDateTime(role.createdAt)}
                    />
                    <List.Item
                        title="Updated"
                        description={formatDateTime(role.updatedAt)}
                    />
                </Card>

                <Card>
                    <Card.Title
                        title="Board Access"
                    />
                    <Card.Content>
                        <View style={styles.chipsWrap}>
                            {role.hasAccess.boards.map((board) => (
                                <Chip key={board} mode="outlined" style={styles.chip} onPress={() => router.navigate(`/boards/${board}`)}>  {/*Doesn't work yet, but will if we have boards*/}
                                    {board}
                                </Chip>
                            ))}
                        </View>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Title
                        title={`Permissions (${role.permissions.length || 0})`}
                    />
                    <Card.Content>
                    {groupedPermissions.map(([bucket, permissions], index) => (
                        <View key={bucket}>
                            {index !== 0 && <Divider style={{ marginVertical: 8 }} />}
                            <Text style={[styles.bucketTitle]}>{bucket}</Text>
                            <View style={styles.chipsWrap}>
                                {permissions.map((permission) => (
                                    <Chip key={permission} mode="outlined" style={styles.chip}>
                                        {permission}
                                    </Chip>
                                ))}
                            </View>
                        </View>
                    ))}
                    {groupedPermissions.length === 0 && (
                        <Text style={styles.muted}>No permissions assigned.</Text>
                    )}
                    </Card.Content>
                </Card>
            </StackLayout>) : (
                <View style={styles.emptyWrap}>
                    <ItemNotFound
                        icon="shield-alert-outline"
                        item="role"
                        itemId={roleId}
                        listRoute="/collaboration/roles"
                    />
                </View>
            )}
        </ResponsiveScreen>
    );
}

const styles = StyleSheet.create({
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { marginBottom: 8 },
    bucketTitle: { fontWeight: "600", marginBottom: 6 },
    muted: { opacity: 0.7 },
    actionsRow: { alignItems: "flex-end", marginTop: 8 },
    emptyWrap: { alignItems: "center", paddingHorizontal: 16, gap: 8 },
    emptyTitle: { fontSize: 20, marginTop: 4, marginBottom: 2 },
    emptyBody: { textAlign: "center", marginBottom: 12 },
    emptyActions: { flexDirection: "row", gap: 12 },
});