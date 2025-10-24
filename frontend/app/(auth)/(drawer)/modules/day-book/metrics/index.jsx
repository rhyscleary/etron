// Author(s): Matthew Parkinson, Noah Bradley

import SearchBar from "../../../../../../components/common/input/SearchBar.jsx";
import Divider from "../../../../../../components/layout/Divider.jsx";
import { View, Button, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Platform } from "react-native";
import Header from "../../../../../../components/layout/Header.jsx";
import { useRouter } from "expo-router";
import { Text, useTheme, Card } from "react-native-paper";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage.jsx";
import GraphTypes from "./graph-types.jsx";
import endpoints from "../../../../../../utils/api/endpoints.js";
import { apiGet } from "../../../../../../utils/api/apiClient.jsx";
import { getCurrentUser } from "aws-amplify/auth";
import ResponsiveScreen from "../../../../../../components/layout/ResponsiveScreen.jsx";

const MetricManagement = () => {
    const router = useRouter();
    const theme = useTheme();
    const [metricsUser, setMetricsUser] = useState([]);
    const [metricsOther, setMetricsOther] = useState([]);
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const getWorkspaceMetrics = useCallback(async () => {
        const workspaceId = await getWorkspaceId();

        let metricData;
        try {
            const metricDataResult = await apiGet(
                endpoints.modules.day_book.metrics.getMetrics,
                { workspaceId }
            );
            metricData = metricDataResult.data;
        } catch (error) {
            console.error("Error getting workspace metrics:", error);
            return;
        }

        const { userId } = await getCurrentUser();
        setMetricsUser(metricData.filter(metric => metric.createdBy == userId))
        setMetricsOther(metricData.filter(metric => metric.createdBy != userId))

        setLoadingMetrics(false);
        setRefreshing(false);
    }, []);

    const filteredUser = useMemo(() => {
        const query = (searchQuery || "").trim().toLowerCase();
        if (!query) return metricsUser;
        return metricsUser.filter(metric => (metric.name ?? "").toLowerCase().includes(query));
    }, [metricsUser, searchQuery]);

    const filteredOther = useMemo(() => {
        const query = (searchQuery || "").trim().toLowerCase();
        if (!query) return metricsOther;
        return metricsOther.filter(metric => (metric.name ?? "").toLowerCase().includes(query));
    }, [metricsOther, searchQuery]);

    useEffect(() => {
        getWorkspaceMetrics();
    }, [])

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getWorkspaceMetrics();
    }, [getWorkspaceMetrics]);

    return (
        <ResponsiveScreen
            header={
                <Header title="Metrics" showMenu showPlus onRightIconPress={() => router.navigate("/modules/day-book/metrics/create-metric")}/>
            }
            center={false}
            padded={false}
            scroll={false}
        >
            <View style={{ flex: 1 }}>
                <SearchBar 
                    placeholder="Search metrics"
                    onSearch={setSearchQuery}
                />

                <ScrollView
                    style = {{ flex: 1 }}
                    refreshControl = {<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle= {{ flexGrow: 1 }}
                    bounces = {true}
                    alwaysBounceVertical = {true}
                    overScrollMode = "always"
                >
                    {loadingMetrics ? <ActivityIndicator size={"large"}/> :
                        <View style={{ paddingHorizontal: 20, gap: 30 }}>
                            <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                                Created by you
                            </Text>
                            <MetricCardList metrics={filteredUser} searchQuery={searchQuery} />

                            <Divider/>
                            
                            <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                                Created by others
                            </Text>
                            <MetricCardList metrics={filteredOther} searchQuery={searchQuery} />
                        </View>
                    }
                </ScrollView>
            </View>
        </ResponsiveScreen>
    )
}

const MetricCardList = ({ metrics, searchQuery }) => {
    const theme = useTheme();
    const router = useRouter();

    if (metrics.length === 0) {
        const query = (searchQuery || "").trim();
        return (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {query ? `No metrics found for "${query}".` : "No metrics to display."}
            </Text>
        );
    }

    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            {metrics.map((metric) => {
                const previewImage = GraphTypes[metric.config.type]?.previewImage;

                return (
                    <TouchableOpacity
                        key={metric.metricId}
                        style={{
                            width: "48%"
                        }}
                        onPress={() =>
                            router.navigate(`/modules/day-book/metrics/view-metric/${metric.metricId}`)
                        }
                    >
                        <Card
                            style={{
                                borderRadius: 5,
                                padding: 10,
                                overflow: "hidden"
                            }}
                        >
                            {previewImage && (
                                <Card.Cover
                                    source={previewImage}
                                    style={{ height: 100, backgroundColor: theme.colors.placeholder, opacity: 0.5 }}
                                />
                            )}
                            <Card.Content
                                style={{
                                    position: "absolute",
                                    bottom: 10
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontSize: 16,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {metric.name}
                                </Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                );
            })}
        </View>
    )
}

export default MetricManagement;

const styles = StyleSheet.create({
    card: {
        overflow: "hidden",
    },
    cardCover: {
        width: 120,
        height: 120,
    },
    cardContent: {
        position: "absolute",
        bottom: 10,
        left: 10,
    }
})