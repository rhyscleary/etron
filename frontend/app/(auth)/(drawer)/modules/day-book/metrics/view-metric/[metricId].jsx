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

/*
import AvatarButton from "../../../../../components/common/buttons/AvatarButton";

const [profilePhotoUri, setProfilePhotoUri] = useState(null);

<AvatarButton
    type={profilePhotoUri ? "image" : "text"}
    imageSource={profilePhotoUri ? {uri: profilePhotoUri} : undefined}
    firstName={!profilePhotoUri ? originalData.firstName : firstName}
    lastName={!profilePhotoUri ? originalData.lastName : lastName}
    badgeType="edit"
    onPress={handleUploadPhoto}
/>
*/


const ViewMetric = () => {
    const { metricId } = useLocalSearchParams();
    
    const [dataRows, setDataRows] = useState([]);
    const [independentVariable, setIndependentVariable] = useState([0]);
    const [dependentVariables, setDependentVariables] = useState([1]);
    const [coloursState, setColoursState] = useState(["red", "blue", "green", "purple"]);
    const [selectedRows, setSelectedRows] = useState([]);
    const router = useRouter();

    const font = useFont(inter, 12);

    useEffect(() => {
        async function getMetricSettings() {
            const workspaceId = await getWorkspaceId();
            console.log("Metric folder:", `workspaces/${workspaceId}/day-book/metrics/${metricId}`);
        
            console.log("Downloading metric settings...");
            try {  // Download metric settings
                const { body } = await downloadData ({
                    path: `workspaces/${workspaceId}/day-book/metrics/${metricId}/metric-settings.json`,
                    options: {
                        bucket: 'workspaces'
                    }
                }).result;
                const metricSettingsJson = JSON.parse(await body.text());
                setDependentVariables(metricSettingsJson.dependentVariables);
                setIndependentVariable(metricSettingsJson.independentVariable);
            } catch (error) {
                console.log("Error downloading metric settings:", error);
                return;
            }
            console.log("Metric settings downloaded successfully");

            try {  // Download metric data
                const { body } = await downloadData ({
                    path: `workspaces/${workspaceId}/day-book/metrics/${metricId}/metric-pruned-data.json`,
                    options: {
                        bucket: 'workspaces'
                    }
                }).result;
                const metricPrunedDataJson = JSON.parse(await body.text());
                setDataRows(metricPrunedDataJson.data);
            } catch (error) {
                console.log("Error downloading pruned data:", error);
                return;
            }
            console.log("Metric pruned data downloaded successfully");
        }
        getMetricSettings();
    }, [metricId]);

    function readyDataToGraphData(rows, independentColumn, dependentColumns = []) {
        return rows.map(row => {
            const rowOutput = { independentVariable: String(row[independentColumn]) };
            dependentColumns.forEach((colIndex, i) => {
                rowOutput["dependentVariables" + i] = Number(row[colIndex]);
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

    const filteredRows = dataRows.filter(
        (row) => selectedRows.includes(row[0])
    );

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
                <Card style={[styles.card]}>
                    <Card.Content>
                        <View style={styles.graphCardContainer}>
                            {graphDef.render({
                                data: readyDataToGraphData(
                                    filteredRows,
                                    independentVariable, 
                                    dependentVariables
                                ),
                                xKey: "independentVariable",
                                yKeys: dependentVariables.map((_, i) => "dependentVariables" + i),
                                colours: coloursState,
                            })}
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>

            <BasicButton
                label="Delete"
                onPress={deleteMetric}
                style={styles.button}
                danger
            />
        </View>
    );
};

export default ViewMetric;

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { height: 260, marginTop: 20, width: "90%", alignSelf: "center" },
    graphCardContainer: { height: "100%", width: "100%" },
    button: { alignSelf: "flex-end" },
});
