// Author(s): Noah Bradley

import { View, ScrollView, StyleSheet, Alert } from "react-native";
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
    
    const [metricSettings, setMetricSettings] = useState(null);
    const [metricData, setMetricData] = useState(null);
    const [metricDownloadStatus, setMetricDownloadStatus] = useState("unstarted");

    const [coloursState, setColoursState] = useState(["red", "blue", "green", "purple"]);
    const router = useRouter();

    useEffect(() => {
        async function getMetricSettings() {
            setMetricDownloadStatus("downloading");
            const workspaceId = await getWorkspaceId();
        
            console.log("Downloading metric settings...");
            let apiResultMetric;
            try {  // Download metric settings
                apiResultMetric = await apiGet(
                    endpoints.modules.day_book.metrics.getMetric(metricId),
                    { workspaceId }
                )
                setMetricSettings(apiResultMetric);
            } catch (error) {
                console.error("Error downloading metric settings:", error);
                setMetricDownloadStatus("failed");
                return;
            }
            console.log("Metric settings downloaded successfully");

            try {  // Download metric data
                let apiResultData = await apiGet(
                    //endpoints.modules.day_book.data_sources.viewData(apiResultMetric.dataSourceId),
                    endpoints.modules.day_book.data_sources.viewDataForMetric(apiResultMetric.dataSourceId, metricId),
                    { workspaceId }
                )
                setMetricData(apiResultData.data);
                console.log("pruned data:", apiResultData.data);
            } catch (error) {
                console.error("Error downloading pruned data:", error);
                setMetricDownloadStatus("failed");
                return;
            }
            console.log("Metric pruned data downloaded successfully");
            setMetricDownloadStatus("downloaded");
        }
        getMetricSettings();
    }, [metricId]);

    function convertToGraphData(rows) {
        const { independentVariable, dependentVariables } = metricSettings.config;
        return rows.map(row => {
            const newRow = {};
            // Always include X key
            newRow[independentVariable] = Number(row[independentVariable]) || row[independentVariable];

            // Only include selected Y keys
            for (const key of dependentVariables) {
                const valueAsNumber = Number(row[key]);
                newRow[key] = !isNaN(valueAsNumber) ? valueAsNumber : row[key];
            }

            return newRow;
        });
    }


    if (metricDownloadStatus !== "downloaded") {
        return (
            <ResponsiveScreen
                header={
                    <Header title="Loading..." showBack />
                }
                center={false}
                padded={false}
                scroll={false}
            >
            </ResponsiveScreen>
        );
    }

    const graphDef = GraphTypes[metricSettings.config.type];
    if (!graphDef) {
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
            await apiDelete(
                endpoints.modules.day_book.metrics.removeMetric(metricId),
                { workspaceId }
            )
            console.log("Successfully deleted metric.")
            router.navigate("/modules/day-book/metrics/metric-management");
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

    if (metricDownloadStatus == "downloaded") {
        return (
            <ResponsiveScreen
                header={
                    <Header
                        title={`${metricSettings.name}`}
                        showBack
                        showEdit
                        onRightIconPress={() =>
                            router.navigate("/modules/day-book/metrics/edit-metric")
                        }
                    />
                }
                center={false}
                padded={false}
                scroll={false}
            >
                <ScrollView style={commonStyles.screen}>
                    <Card style={[styles.card]}>
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
                </ScrollView>

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
    card: { height: 260, marginTop: 20, width: "90%", alignSelf: "center" },
    graphCardContainer: { height: "100%", width: "100%" },
    button: { alignSelf: "flex-end" },
});
