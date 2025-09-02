// Author(s): Noah Bradley

import { View } from "react-native";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { downloadData } from "aws-amplify/storage";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { CartesianChart, Line, useChartPressState } from "victory-native";  // TO DO: TURN THE GRAPH DISPLAY INTO A COMPONENT SO THAT THIS ISN'T JUST DUPLICATING THE CODE FROM CREATE-METRIC.JSX
import inter from "../../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import { useFont, Circle, Text as SkiaText } from "@shopify/react-native-skia";

const ViewMetric = () => {
    const { metricId } = useLocalSearchParams();
    
    const [dataRows, setDataRows] = useState([]);
    const [independentVariable, setIndependentVariable] = useState();
    const [dependentVariables, setDependentVariables] = useState([]);

    useEffect(() => {
        async function getMetricSettings() {
            const workspaceId = await getWorkspaceId();
            console.log("Metric folder:", `workspaces/${workspaceId}/metrics/${metricId}`);
        
            console.log("Downloading metric settings...");
            try {  // Download metric settings
                const { body } = await downloadData ({
                    path: `workspaces/${workspaceId}/metrics/${metricId}/metric-settings.json`,
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
                    path: `workspaces/${workspaceId}/metrics/${metricId}/metric-pruned-data.json`,
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
    }, []);

    const { chartPressState, chartPressIsActive } = useChartPressState({ x: 0, y: {dependentVariable0: 0}})
    const font = useFont(inter, 12);
    const colours = ["white", "red", "blue", "green", "purple", "orange"]

    function readyDataToGraphData(rows, independentColumn, dependentColumns=[]) {
        const output = rows.map(row => { //creates a json object with 1 independent variable and several dependent variables
            let rowOutput = {independentVariable: String(row[independentColumn])}  // Issue: this doesn't resort the data, so the independentVariable can be out of order and look weird (but still correct) 
            for (let i = 0; i < dependentColumns.length; i++) (
                rowOutput["dependentVariable" + (i)] = Number(row[dependentColumns[i]])
            );
            return rowOutput;
        });
        return output;
    }

    return (
        <View style={commonStyles.screen}>
            <Header title={`${metricId}`} showBack showEdit />

            <CartesianChart
                data = {readyDataToGraphData(dataRows, independentVariable, dependentVariables)}
                xKey = "independentVariable"
                yKeys = {dependentVariables.map((_, index) => "dependentVariable" + index)}
                axisOptions = {{ font }}
                chartPressState = { chartPressState }
                domain = {{y:[0]}}
                renderOutside = {({ chartBounds }) => (
                    <>
                        {chartPressIsActive && (
                            <>
                                <GraphTooltip
                                    xPosition={chartPressState.x.position.value}
                                    yPosition={chartPressState.y.dependentVariable0.position.value}
                                />
                            </>
                        )}
                    </>
                )}
            >
                {({ points }) => (
                    <>
                        {dependentVariables.map((_, index) => {
                            return (
                                <Line
                                    points = {points["dependentVariable" + index]}
                                    color = {colours[index]}
                                    strokeWidth = {3}
                                />
                            )
                        })}
                        
                        {chartPressIsActive ? (
                            <>
                                
                            </>
                        ) : null}
                    </>
                )}
            </CartesianChart>
        </View>
    )
}

export default ViewMetric;