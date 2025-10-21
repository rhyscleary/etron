// Author(s): Rhys Cleary

import { useCallback, useEffect, useState } from "react";
import { FlatList, View, StyleSheet } from "react-native";
import Header from "../../../../components/layout/Header";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";
import { apiGet } from "../../../../utils/api/apiClient";
import endpoints from "../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import { List, Text } from "react-native-paper";
import PlaceholderListItem from "../../../../components/skeleton/PlaceholderListItem";
import ErrorRetry from "../../../../components/common/errors/ErrorRetry";
import SearchBar from "../../../../components/common/input/SearchBar";
import { useMemo } from "react";
import { useTheme } from "react-native-paper";

const AMOUNT_PLACEHOLDERS = 20;

const WorkspaceLog = () => {
    const [workspaceId, setWorkspaceId] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [lastKey, setLastKey] = useState(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [usersMap, setUsersMap] = useState({});
    const theme = useTheme();

    const availableFilters = ["All", "Login", "Settings", "System", "Created", "Updated"];

    // Fetch workspace and users
    useEffect(() => {
        const init = async () => {
        try {
            const id = await getWorkspaceId();
            setWorkspaceId(id);
            if (id) {
                await fetchUsers(id);
                await fetchWorkspaceLogs(id);
            }
        } catch (err) {
            console.error("Failed to initialise Workspace Log screen:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
        };
        init();
    }, []);

    // fetch all the users at once
    const fetchUsers = async (workspaceId) => {
        try {
            const response = await apiGet(endpoints.workspace.users.getUsers(workspaceId));
            if (response.status === 200) {
            const map = {};
            response.data.forEach(user => {
                map[user.userId] = {
                    ...user,
                    fullName: `${user.given_name} ${user.family_name}`
                };
            });
            setUsersMap(map);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    // Fetch workspace logs
    const fetchWorkspaceLogs = useCallback(async (workspaceId, startKey = null) => {
        setError(false);
        try {
            const params = { workspaceId };
            if (startKey) params.lastKey = startKey; // pagination

            const response = await apiGet(endpoints.audits.core.getAudits, params);

            if (response.status !== 200) {
                setError(true);
                return;
            }
            console.log(response.data);
            const data = response.data?.items || response.data || [];
            const newLastKey = response.data?.lastKey || null;

            if (startKey) {
                setLogs((prev) => [...prev, ...data]);
            } else {
                setLogs(Array.isArray(data) ? data : []);
            }

            setLastKey(newLastKey);
        } catch (err) {
            console.error("Failed to fetch workspace logs:", err);
            setError(true);
        }
    }, []);

    // load more logs if a pagination key is present
    const loadMoreLogs = async () => {
        if (!lastKey || isFetchingMore) return;
        setIsFetchingMore(true);
        await fetchWorkspaceLogs(workspaceId, lastKey);
        setIsFetchingMore(false);
    };

    // filter and search
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesFilter =
                selectedFilter === "All" ||
                (log.type &&
                    log.type.toLowerCase() === selectedFilter.toLowerCase());

            const matchesSearch =
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.details &&
                    JSON.stringify(log.details)
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()));

            return matchesFilter && matchesSearch;
        });
    }, [logs, searchQuery, selectedFilter]);

    // Render log item
    const renderLogItem = ({ item }) => {
        const timestamp = new Date(item.timestamp).toLocaleString();
        const userName = usersMap[item.userId]?.fullName || item.userId;

        return (
            <View style={[styles.logItemContainer, { backgroundColor: theme.colors.buttonBackground }]}>
                <View style={styles.logTextContainer}>
                <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>
                    {userName} - {item.action}
                </Text>
                <Text style={[styles.timestampText, { color: theme.colors.onSurfaceVariant }]}>
                    {timestamp}
                </Text>
                </View>
            </View>
        );
    };

    // --- Placeholder UI while loading ---
    const renderPlaceholderList = () =>
        Array.from({ length: AMOUNT_PLACEHOLDERS }).map((_, index) => (
        <PlaceholderListItem key={index} />
        ));

    return (
        <ResponsiveScreen
            header={<Header title="Workspace Log" showBack />}
            center={false}
            padded={false}
            scroll={false}
        >
            <View style={styles.contentContainer}>
                <SearchBar
                    placeholder="Search logs..."
                    onSearch={setSearchQuery}
                    onFilterChange={setSelectedFilter}
                    filters={availableFilters}
                />

                {loading ? (
                    renderPlaceholderList()
                ) : error ? (
                    <ErrorRetry
                        message="Failed to load workspace logs."
                        onRetry={async () => {
                            setLoading(true);
                            await fetchWorkspaceLogs(workspaceId);
                            setLoading(false);
                        }}
                    />
                ) : filteredLogs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text>No logs found for this workspace.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredLogs}
                        renderItem={renderLogItem}
                        keyExtractor={(item, index) => item?.logId ?? index.toString()}
                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                        ListFooterComponent={
                            isFetchingMore ? (
                                <View style={{ padding: 20 }}>
                                    <Text style={{ textAlign: "center" }}>Loading more...</Text>
                                </View>
                            ) : <View style={{ height: 40 }} />
                        }
                        onEndReachedThreshold={0.5}
                        onEndReached={loadMoreLogs}
                    />
                )}
            </View>
        </ResponsiveScreen>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    logItemContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderRadius: 10,
        padding: 10,
        marginVertical: 4,
    },
    logTextContainer: {
        flex: 1,
    },
    actionText: {
        fontSize: 14,
        lineHeight: 20,
    },
    timestampText: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
});

export default WorkspaceLog;