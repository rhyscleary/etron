// Author(s): Noah Bradley

import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import Header from "../../../../../components/layout/Header";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { apiGet } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Card, Chip, Divider, List, Text, useTheme, Button, } from "react-native-paper";
import formatDateTime from "../../../../../utils/format/formatISODate";
import ItemNotFound from "../../../../../components/common/errors/MissingItem";
import StackLayout from "../../../../../components/layout/StackLayout";

function buildPermissionIndex(tree) {
    const index = {}; // key -> { label, description, section, categoryLabel }

    // Core "app" permissions
    if (tree?.app?.categories) {
        const sectionLabel = tree.app.label || "Workspace";
        for (const [catKey, cat] of Object.entries(tree.app.categories)) {
        const categoryLabel = cat.label || catKey;
        for (const p of cat.permissions || []) {
            index[p.key] = {
            label: p.label || p.key,
            description: p.description || "",
            section: sectionLabel,
            categoryLabel,
            };
        }
        }
    }

    // Modules (Day Book etc.)
    if (tree?.modules?.daybook?.categories) {
        const sectionLabel = tree.modules.daybook.label || "Day Book";
        for (const [catKey, cat] of Object.entries(tree.modules.daybook.categories)) {
        const categoryLabel = cat.label || catKey;
        for (const p of cat.permissions || []) {
            index[p.key] = {
            label: p.label || p.key,
            description: p.description || "",
            section: sectionLabel,
            categoryLabel,
            };
        }
        }
    }

    return index;
}

function groupSelectedPermissions(selectedKeys = [], permIndex = {}) {
    const grouped = {}; // section -> { categoryLabel -> [{key,label,description}] }
    const unknown = [];

    for (const key of selectedKeys) {
        const meta = permIndex[key];
        if (!meta) {
        unknown.push({ key, label: key, description: "" });
        continue;
        }
        const { section, categoryLabel, label, description } = meta;
        grouped[section] ||= {};
        grouped[section][categoryLabel] ||= [];
        grouped[section][categoryLabel].push({ key, label, description });
    }

    // If unknowns exist, put them in a generic section
    if (unknown.length) {
        const section = "Other";
        const category = "Unknown";
        grouped[section] ||= {};
        grouped[section][category] = unknown;
    }

    // Convert to a render-friendly array
    // [{ section, categories: [{ categoryLabel, permissions: [{key,label,description}...] }] }]
    return Object.entries(grouped).map(([section, catObj]) => ({
        section,
        categories: Object.entries(catObj).map(([categoryLabel, perms]) => ({
        categoryLabel,
        permissions: perms.sort((a, b) => a.label.localeCompare(b.label)),
        })),
    }));
}

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

    const [role, setRole] = useState(null)
    const [permIndex, setPermIndex] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [roleExists, setRoleExists] = useState(true);
    const [openAccordions, setOpenAccordions] = useState({});

    const loadRole = useCallback(async () => {
        try {
            const workspaceId = await getWorkspaceId();

            let result = await apiGet(endpoints.workspace.roles.getRole(workspaceId, roleId));
            const role = result.data;

            if (!role) {
                setRoleExists(false);
                return;
            }
            setRole(role);

            result = await apiGet(endpoints.workspace.core.getDefaultPermissions);
            setPermIndex(buildPermissionIndex(result.data));
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

    const groupedReadable = useMemo(
        () => groupSelectedPermissions(role?.permissions || [], permIndex),
        [role, permIndex]
    );

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
                    <List.Item title="Created" description={formatDateTime(role.createdAt)} />
                    <List.Item title="Updated" description={formatDateTime(role.updatedAt)} />
                </Card>

                {!role.owner && (<>
                    <Card>
                        <Card.Title   title="Board Access" />
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
                        <Card.Title title={`Permissions (${role.permissions.length || 0})`} />
                        <Card.Content>
                            {!(groupedReadable.length > 0) ? (
                                <Text style={styles.muted}>No permissions assigned.</Text>
                            ) : (
                                groupedReadable.map(({ section, categories }, index) => (
                                    <View key={section}>
                                        {index !== 0 && <Divider style={{ marginVertical: 8 }} />}
                                        <Text style={styles.sectionTitle}>{section}</Text>

                                        {categories.map((category) => {
                                            const open = !!openAccordions[`${section}:${category.categoryLabel}`];
                                            return (
                                                <View key={`${section}:${category.categoryLabel}`} style={{ marginBottom: 6 }}>
                                                    <List.Accordion
                                                        title={category.categoryLabel}
                                                        expanded={open}
                                                        onPress={() =>
                                                            setOpenAccordions((s) => ({
                                                                ...s,
                                                                [`${section}:${category.categoryLabel}`]: !s[`${section}:${category.categoryLabel}`],
                                                            }))
                                                        }
                                                    >
                                                        {category.permissions.map((permission) => (
                                                            <List.Item
                                                                key={permission.key}
                                                                title={permission.label}
                                                                description={permission.description}
                                                            />
                                                        ))}
                                                    </List.Accordion>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>
                </>)}
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