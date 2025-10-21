// Author(s): Noah Bradley

import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Card } from "react-native-paper";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import GraphTypes from '../graph-types';
import inter from "../../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import BasicButton from "../../../../../../../components/common/buttons/BasicButton";
import endpoints from "../../../../../../../utils/api/endpoints";
import { apiGet, apiDelete } from "../../../../../../../utils/api/apiClient";
import ResponsiveScreen from "../../../../../../../components/layout/ResponsiveScreen";
import ItemNotFound from "../../../../../../../components/common/errors/MissingItem";


const ViewMetric = () => {
    const { metricId } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [metricSettings, setMetricSettings] = useState(null);
    const [metricData, setMetricData] = useState(null);
    const [metricExists, setMetricExists] = useState(true);

    const [coloursState, setColoursState] = useState(["red", "blue", "green", "purple"]);
    const router = useRouter();

    useEffect(() => {
        getMetricSettings();
    }, [metricId]);

    async function getMetricSettings() {
        setLoading(true)
        const workspaceId = await getWorkspaceId();
    
        let metricSettings;
        try {  // Download metric settings
            const result = await apiGet(
                endpoints.modules.day_book.metrics.getMetric(metricId),
                { workspaceId }
            )
            metricSettings = result.data;
            setMetricSettings(metricSettings);
            console.log("metricSettings:", metricSettings);
        } catch (error) {
            console.error("Error downloading metric settings:", error);
            return;
        }

        console.log("metricSettings:", metricSettings);
        if (!metricSettings) {
            setMetricExists(false);
            setLoading(false);
            return;
        }

        try {  // Download metric data
            let result = await apiGet(
                endpoints.modules.day_book.data_sources.viewDataForMetric(metricSettings.dataSourceId, metricId),
                { workspaceId }
            )
            setMetricData(result.data.data);
        } catch (error) {
            console.error("Error downloading pruned data:", error);
            return;
        }

        setLoading(false);
    }

    if (loading || !metricExists) {
        return (
            <ResponsiveScreen
                header={
                    <Header title="View Metric" showBack />
                }
                center={metricExists ? false : true}
                padded={false}
                scroll={false}
            >
                {metricExists ? (
                    <ActivityIndicator size="large" />
                ) : (
                    <ItemNotFound
                        icon = "alert-circle-outline"
                        item = "metric"
                        itemId = {metricId}
                        listRoute = "/modules/day-book/metrics/"
                    />
                )}
            </ResponsiveScreen>
        ) 
    }

    function convertToGraphData(rows) {
        const { independentVariable, dependentVariables } = metricSettings.config;
        const graphRows = rows.map(row => {
            const newRow = {};
            newRow[independentVariable] = Number(row[independentVariable]) || row[independentVariable];
            for (const key of dependentVariables) {
                const valueAsNumber = Number(row[key]);
                newRow[key] = !isNaN(valueAsNumber) ? valueAsNumber : row[key];
            }

            return newRow;
        });
        return graphRows;
    }

    const graphDef = GraphTypes[metricSettings.config.type];
    /*if (!graphDef) {
        return (
            <ResponsiveScreen
                header={
                    <Header title="Unknown Graph Type" showBack />
                }
                center={false}
                padded={false}
                scroll={false}
            >
            </ResponsiveScreen>
        );
    }*/

    async function deleteMetric() {
        const confirmed = await new Promise((resolve) => {
            Alert.alert(
                "Delete Metric",
                "Are you sure you want to delete this metric?",
                [
                    { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
                    { text: "Delete", onPress: () => resolve(true), style: "destructive" },
                ]
            );
        });

        if (!confirmed) return;

        try {
            const workspaceId = await getWorkspaceId();
            await apiDelete(
                endpoints.modules.day_book.metrics.removeMetric(metricId),
                { workspaceId }
            )
            router.navigate("/modules/day-book/metrics");
        } catch (error) {
            console.error("Error deleting metric:", error);
            Alert.alert("Error", "Failed to delete the metric. Please try again.");
        }
    }

    let filteredData = convertToGraphData(metricData);
    if (metricSettings.config.selectedRows && metricSettings.config.selectedRows.length > 0) {
        filteredData = filteredData.filter(
            row => metricSettings.config.selectedRows.includes(row[metricSettings.config.independentVariable])
        );
    }

    if (!loading) {
        return (
            <ResponsiveScreen
                header={
                    <Header
                        title={"View Metric"}
                        showBack
                        showEdit
                        onRightIconPress={() =>
                            router.navigate(`/modules/day-book/metrics/edit-metric/${metricId}`)
                        }
                    />
                }
                center={false}
            >
                <Card style={[styles.card]}>
                    <Card.Title title={metricSettings.name}/>
                    <Card.Content>
                        <View style={styles.graphCardContainer}>
                            {graphDef.render({
                                data: filteredData,
                                xKey: metricSettings.config.independentVariable,
                                yKeys: metricSettings.config.dependentVariables,
                                colours: metricSettings.config.colours || coloursState,
                            })}
                        </View>
                    </Card.Content>
                </Card>

                <BasicButton
                    label="Delete"
                    onPress={deleteMetric}
                    style={styles.button}
                    danger
                />
            </ResponsiveScreen>
        );
    }
};

export default ViewMetric;

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { marginTop: 20, alignSelf: "center" },
    graphCardContainer: { aspectRatio: 16 / 20, width: "100%" },
    button: { alignSelf: "flex-end" },
});
