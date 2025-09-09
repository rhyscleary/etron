// Author(s): Noah Bradley

import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Card } from "react-native-paper";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { downloadData, remove } from "aws-amplify/storage";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import GraphTypes from '../graph-types';
import inter from "../../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import { useFont } from "@shopify/react-native-skia";
import BasicButton from "../../../../../../../components/common/buttons/BasicButton";

const ViewMetric = () => {
    const { metricId } = useLocalSearchParams();
    const [metricSettings, setMetricSettings] = useState({});
    const [dataRows, setDataRows] = useState([]);
    const [independentVariable, setIndependentVariable] = useState();
    const [dependentVariables, setDependentVariables] = useState([]);
    const router = useRouter();
    
    const [chosenIndependentVariable, setChosenIndependentVariable] = useState([0]);
    const [chosenDependentVariables, setChosenDependentVariables] = useState([1, 2, 3]);
    const [coloursState, setColoursState] = useState(["red", "blue", "green", "purple"]);
    
    
    const font = useFont(inter, 12);

    useEffect(() => {
        async function getMetricSettings() {
            try {
                const workspaceId = await getWorkspaceId();
                const { body } = await downloadData({
                    path: `workspaces/${workspaceId}/metrics/${metricId}/metric_settings.json`,
                    options: { bucket: 'workspaces' }
                }).result;
            
                const metricJson = JSON.parse(await body.text());
                setMetricSettings(metricJson);
                setDataRows(metricJson.data || []);
                setIndependentVariable(metricJson.independentVariable);
                setDependentVariables(metricJson.dependentVariables || []);
                setColoursState(metricJson.colours || ["red", "blue", "green", "purple"]);
            } catch (error) {
                console.error("Error downloading metric data:", error);
            }
        }

        getMetricSettings();
    }, [metricId]);

    function readyDataToGraphData(rows, independentColumn, dependentColumns = []) {
        return rows.map(row => {
            const rowOutput = { independentVariable: String(row[independentColumn]) };
            dependentColumns.forEach((colIndex, i) => {
                rowOutput["dependentVariable" + i] = Number(row[colIndex]);
            });
            return rowOutput;
        });
    }

    if (!metricSettings || !font) {
        return (
            <View style={commonStyles.screen}>
                <Header title="Loading..." showBack />
            </View>
        );
    }

    const graphDef = GraphTypes[metricSettings.type];
    if (!graphDef) {
        return (
            <View style={commonStyles.screen}>
                <Header title="Unknown Graph Type" showBack />
            </View>
        );
    }

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
            await remove({
                path: `workspaces/${workspaceId}/metrics/${metricId}/metric_settings.json`,
                options: { bucket: 'workspaces' }
            });
            router.push("/modules/day-book/metrics/metric-management");
        } catch (error) {
            console.error("Error deleting metric:", error);
            Alert.alert("Error", "Failed to delete the metric. Please try again.");
        }
    }

    return (
        <View style={styles.container}>
            <Header
                title={`${metricId}`}
                showBack
                showEdit
                onRightIconPress={() =>
                    router.navigate("/modules/day-book/metrics/edit-metric")
                }
            />

            <ScrollView style={commonStyles.screen}>
                <Card style={[styles.card, { marginTop: 20 }]}>
                    <Card.Content>
                        <View style={styles.graphCardContainer}>
                            {graphDef.render({
                                data: readyDataToGraphData(
                                    dataRows, 
                                    chosenIndependentVariable, 
                                    chosenDependentVariables
                                ),
                                xKey: "independentVariable",
                                yKeys: chosenDependentVariables.map(
                                    (_, i) => "dependentVariable" + i
                                ),
                                colours: coloursState, // dynamic per-variable colours
                            })}
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>

            <BasicButton
                label = "Delete"
                onPress={deleteMetric}
                style={styles.button}
                danger
            />
        </View>
    );
};

export default ViewMetric;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        height: 270,
        marginTop: 20,
        width: "90%",
        alignSelf: "center",
    },
    graphCardContainer: {
        height: "80%",
        width: "100%",
        marginTop: 12,
    },
    button: {
        alignSelf: "flex-end"
    },
})