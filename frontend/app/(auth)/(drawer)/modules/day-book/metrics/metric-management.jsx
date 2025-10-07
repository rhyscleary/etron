// Author(s): Matthew Parkinson, Noah Bradley

import SearchBar from "../../../../../../components/common/input/SearchBar.jsx";
import Divider from "../../../../../../components/layout/Divider.jsx";
import { View, Button, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { useRouter } from "expo-router";
import { Text, useTheme, Card } from "react-native-paper";
import { useEffect, useState } from "react";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage.jsx";
import GraphTypes from "./graph-types.jsx";
import endpoints from "../../../../../../utils/api/endpoints.js";
import { apiGet } from "../../../../../../utils/api/apiClient.jsx";
import { getCurrentUser } from "aws-amplify/auth";

const MetricManagement = () => {
    const router = useRouter();
    const theme = useTheme();
    const [metrics, setMetrics] = useState([]);
    const [metricsUser, setMetricsUser] = useState([]);
    const [metricsOther, setMetricsOther] = useState([]);
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    useEffect(() => {
        async function getWorkspaceMetrics() {
            const workspaceId = await getWorkspaceId();
            const filePathPrefix = `workspaces/${workspaceId}/day-book/metrics/`

            try {
                const metricData = await apiGet(
                    endpoints.modules.day_book.metrics.getMetrics,
                    { workspaceId }
                );
                console.log(metricData);
                setMetrics(metricData);
            } catch (error) {
                console.error("Error getting workspace metrics:", error);
            } finally {
                setLoadingMetrics(false);
            }
        }
        getWorkspaceMetrics();
    }, []);

    useEffect(() => {
        async function sortMetrics() {
            const { userId, attributes } = await getCurrentUser();
            const mappedMetrics = metrics.map(metric => ({
                ...metric,
                firstName: metric.firstName || "Unknown",
                lastName: metric.lastName || "User",
            }));
            setMetricsUser(mappedMetrics.filter(metric => metric.createdBy === userId));
            setMetricsOther(mappedMetrics.filter(metric => metric.createdBy !== userId));
        }
        sortMetrics();
    }, [metrics])

    const [color, setColor] = useState('#ff0000');

    return (
        <View style={commonStyles.screen}>
            <Header title="Metrics" showMenu showPlus onRightIconPress={() => router.navigate("/modules/day-book/metrics/create-metric")}/>
            
            <View style={{ flex: 1 }}>
                <SearchBar/>

                {/*Temporary redirect to profile screen*/}
                <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/dashboard")} />

                <ScrollView>

                    <View style={{ paddingHorizontal: 20, gap: 30 }}>
                        <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                            Created by you
                        </Text>
                        {loadingMetrics && <ActivityIndicator />}
                        {metricCardList(loadingMetrics, metricsUser)}

                        <Divider/>
                        
                        <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                            Created by others
                        </Text>
                        {loadingMetrics && <ActivityIndicator />}
                        {metricCardList(loadingMetrics, metricsOther)}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const metricCardList = (loadingMetrics, metrics) => {
    const theme = useTheme();
    const router = useRouter();
    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {!loadingMetrics &&
                metrics.map((metric) => {
                    const previewImage = GraphTypes[metric.config.type]?.previewImage;

                    return (
                        <TouchableOpacity
                            key={metric.metricId}
                            style={{
                                width: "45%"
                            }}
                            onPress={() =>
                                router.navigate(`./view-metric/${metric.metricId}`)
                            }
                        >
                            <Card
                                style={{
                                    borderRadius: 5,
                                    paddingVertical: 10
                                }}
                            >
                                {previewImage && (
                                    <Card.Cover
                                        source={previewImage}
                                        style={{ height: 150, backgroundColor: theme.colors.placeholder, opacity: 0.5 }}
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

                                    <Text
                                        style={{
                                            color: "white",
                                            fontSize: 10,
                                            marginTop: 2,
                                        }}
                                    >
                                        {metric.firstName} {metric.lastName}
                                    </Text>
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    );
                })
            }
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