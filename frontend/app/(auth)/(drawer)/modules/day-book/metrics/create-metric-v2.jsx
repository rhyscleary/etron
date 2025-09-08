import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { Text, Card, ActivityIndicator, DataTable } from "react-native-paper";
import BasicButton from "../../../../../../components/common/buttons/BasicButton";
import DropDown from '../../../../../../components/common/input/DropDown';
import TextField from '../../../../../../components/common/input/TextField';
import MetricCheckbox from '../../../../../../components/common/buttons/MetricCheckbox';
import MetricRadioButton from '../../../../../../components/common/buttons/MetricRadioButton';
import GraphTypes from './graph-types';
import endpoints from '../../../../../../utils/api/endpoints';

import csvtojson from 'csvtojson';

import { list, downloadData, uploadData } from 'aws-amplify/storage';
import amplifyOutputs from '../../../../../../amplify_outputs.json'
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage"
import { ResourceSavingView } from '@react-navigation/elements';


import { CartesianChart, Line, useChartPressState, VictoryLabel, Bar } from "victory-native";
import { SharedValue } from "react-native-reanimated";
import inter from "../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import { useFont, Circle, Text as SkiaText } from "@shopify/react-native-skia";

const CreateMetric = () => {
    const router = useRouter();


    const [workspaceReadyData, setWorkspaceReadyData] = useState([]);  // Array of file paths for ready-data in the workspace
    const [loadingWorkspaceReadyData, setLoadingWorkspaceReadyData] = useState(true);
    
    useEffect(() => {
        async function initialiseWorkspaceReadyData() {
            const workspaceId = await getWorkspaceId();

            try {
                const result = await list ({
                    path: `workspaces/${workspaceId}/readyData/`,
                    options: {
                        bucket: "workspaces"
                    }
                })
                const workspaceReadyDataPaths = result.items.map(item => item.path);
                setWorkspaceReadyData(workspaceReadyDataPaths);
                setLoadingWorkspaceReadyData(false);
            } catch (error) {
                console.error('Error retrieving ready data:', error);
                return;
            }
        }
        initialiseWorkspaceReadyData();
    }, []);


    const [readyDataDownloadProgress, setReadyDataDownloadProgress] = useState(0);
    const [storedData, setStoredData] = useState(null);  // Data chosen by the user to be loaded into the graph
    const [loadingStoredData, setLoadingStoredData] = useState(false);

    const handleWorkspaceReadyDataSelect = async (source) => {
        console.log('Downloading ready data:', source);
        setReadyDataDownloadProgress(0);
        try {
            const { body, eTag } = await downloadData({
                path: source,
                options: {
                    onProgress: (progress) => {
                        setReadyDataDownloadProgress(Math.round((progress.transferredBytes / progress.totalBytes) * 100));
                        console.log(`Download progress: ${(progress.transferredBytes/progress.totalBytes) * 100}% bytes`);
                    },
                    bucket: "workspaces"
                }
            }).result;
            setReadyDataDownloadProgress(100)
            setLoadingStoredData(true);

            const csvText = await body.text();
            console.log('Download length: ', csvText.length);
            
            const csv = require('csvtojson');
            const csvRow = await csv({
                noheader: true,
                output: 'csv',
            }).fromString(csvText)
            
            setStoredData(csvRow);
            setLoadingStoredData(false);
            console.log("Stored data length:", csvRow.length);

            //setStoredData(await body.text());
        } catch (error) {
            console.error('Error downloading data source:', error);
            setLoadingStoredData(false);
        }
    }


    useEffect(() => {
        if (storedData) {
            console.log("Stored data updated. Length:", storedData.length);
        }
    }, [storedData]);


    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedReadyData, setSelectedReadyData] = useState(null);


    const rowLoadAmount = 5;  // How many rows are loaded at a time in the data preview
    const [rowLimit, setRowLimit] = useState(rowLoadAmount);  // How many roads are loaded total (will update over time)
    const dataHeader = useMemo(() => storedData?.[0] ?? [], [storedData]);
    const dataRows = useMemo(() => storedData?.slice(1) ?? [], [storedData]);
    const displayedRows = useMemo(() => dataRows.slice(0, rowLimit), [dataRows, rowLimit]);
    const [loadingMoreRows, setLoadingMoreRows] = useState(false);

    const onPreviewBottomReached = useCallback(() => {
        if (loadingMoreRows) return;
        if (rowLimit >= dataRows.length) return;

        setLoadingMoreRows(true);
        requestAnimationFrame(() => {
            setRowLimit((prev) => Math.min(prev + rowLoadAmount, dataRows.length));
            setLoadingMoreRows(false);
        });
    }, [dataRows.length, rowLimit]);


    const { chartPressState, chartPressIsActive } = useChartPressState({ x: 0, y: {dependentVariable0: 0}})
    const font = useFont(inter, 12);

    function GraphTooltip({text, xPosition, yPosition}) {
        return (<>
            <SkiaText
                color = "grey"
                font = {font}
                text = {"test"}
                x = {xPosition}
                y = {yPosition - 15}
            />
            <Circle cx={xPosition} cy={yPosition} r={8} color="white" />
        </>)
    }


    const [chosenIndependentVariable, setChosenIndependentVariable] = useState([0]);  // Hard-coded value, but should be set by the user
    const [chosenDependentVariables, setChosenDependentVariables] = useState([1, 2, 3]);  // Hard-coded values, but should be set by the user
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


    const [step, setStep] = useState(0);
    const totalSteps = 4;

    const handleBack = () => {
        if (step === 0) {
            router.back();
        } else {
            setStep((prev) => prev - 1);
        }
    };

    const handleContinue = () => {
        setStep((prev) => prev + 1);
    };

    const [metricName, setMetricName] = React.useState('');

    const handleFinish = async () => {
        // Upload metric settings
        try {
            const metricSettings = {
                type: selectedMetric,
                data: dataRows,
                independentVariable: chosenIndependentVariable,
                dependentVariables: chosenDependentVariables,
            }
            const workspaceId = await getWorkspaceId();
            const S3FilePath = `workspaces/${workspaceId}/metrics/${metricName.replace(/ /g, "_")}/metric_settings.json`
            console.log("File path:", S3FilePath)
            const result = uploadData({
                path: S3FilePath,
                data: JSON.stringify(metricSettings),
                options: {
                    bucket: "workspaces"
                }
            }).result;
            console.log("File uploaded successfully.");
        } catch (error) {
            console.log("Error uploading metric settings:", error);
            return;
        }
        console.log("Form completed");
        router.navigate("/modules/day-book/metrics/metric-management"); 
    }

    const renderFormStep = () => {
        switch (step) {
            case 0:
                return (
                    <ScrollView>
                        <DropDown
                            title = "Select Data Source"
                            items = {loadingWorkspaceReadyData ? ["Loading..."] : workspaceReadyData.map(URL => ({value: URL, label: URL.split('/').at(-1)}))}
                            onSelect={(item) => handleWorkspaceReadyDataSelect(item)}
                        />

                        <DropDown
                            title = "Select Metric"
                            items={Object.values(GraphTypes).map((g) => ({
                                value: g.value,
                                label: g.label,
                            }))}
                            showRouterButton={false}
                            onSelect={(item) => setSelectedMetric(item)}
                        />
                                                   
                        <Card style={styles.card}>
                            <Card.Content>
                                {readyDataDownloadProgress == 0 && (
                                    <Text>Display preview here</Text>
                                )}
                                {readyDataDownloadProgress > 0 && readyDataDownloadProgress < 100 && (
                                    <Text>Downloading data source: {readyDataDownloadProgress}%</Text>
                                )}
                                {readyDataDownloadProgress == 100 && loadingStoredData && (
                                    <ActivityIndicator size="large" color="#0000ff" />
                                )}
                                {readyDataDownloadProgress == 100 && !loadingStoredData && (
                                    <ScrollView horizontal
                                        showsHorizontalScrollIndicator
                                    >
                                        <View style={{ minWidth: (dataHeader?.length ?? 0) * 100 }}>
                                            <DataTable>{/* Displays a preview of the data as a table */} 
                                                <DataTable.Header>
                                                    {dataHeader.map((header, index) => (
                                                        <DataTable.Title key={index} numberOfLines={1}>
                                                            <Text>{String(header)}</Text>
                                                        </DataTable.Title>
                                                    ))}
                                                </DataTable.Header>
                                                <FlatList
                                                    data={displayedRows}
                                                    renderItem={({ item }) => (
                                                        <DataTable.Row>
                                                            {item.map((cell, index) => (
                                                                <DataTable.Cell key={index} style={{ width: 100 }} numberOfLines={1}>
                                                                    <Text>{String(cell)}</Text>
                                                                </DataTable.Cell>
                                                            ))}
                                                        </DataTable.Row>
                                                    )}
                                                    nestedScrollEnabled={true}
                                                    style={{ maxHeight: 180 /*shouldn't be hardcoded*/}}
                                                    initialNumToRender={5}
                                                    windowSize={10}
                                                    removeClippedSubviews={true}
                                                    onEndReached={onPreviewBottomReached}
                                                    onEndReachedThreshold={0.1} 
                                                    ListFooterComponent={
                                                        loadingMoreRows ? (
                                                            <ActivityIndicator size="small" color="#0000ff" />
                                                        ) : null
                                                    }
                                                />
                                            </DataTable>
                                        </View>
                                    </ScrollView>
                                )}
                            </Card.Content>
                        </Card>
                    </ScrollView>
                )
            case 1:
                return (
                    <ScrollView>
                        <Text>Select Independent Variable (X-Axis)</Text>
                        <MetricRadioButton
                            items={dataHeader}
                            selected={dataHeader[chosenIndependentVariable[0]]}
                            onChange={(selection) => {
                                // Find the column index for the chosen independent variable
                                const index = dataHeader.findIndex((h) => h === selection);
                                setChosenIndependentVariable(index >= 0 ? [index] : []);
                            }}
                        />

                        <Text style={{ marginTop: 12 }}>Select Dependent Variables (Y-Axis)</Text>
                        <MetricCheckbox
                            items={dataHeader}
                            selected={chosenDependentVariables.map((i) => dataHeader[i])}
                            onChange={(selection) => {
                                // Convert names back into indices
                                const indices = selection
                                    .map((h) => dataHeader.findIndex((x) => x === h))
                                    .filter((i) => i >= 0);
                                setChosenDependentVariables(indices);
                            }}
                        />
                    </ScrollView>
                )
            case 2:
                const graphDef = GraphTypes[selectedMetric]; // Get chosen graph definition
                if (!graphDef) {
                    return <Text>Please select a metric to preview</Text>;
                }

                return (
                    <Card style={styles.card}>
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
                                    colours: ["red", "blue", "green", "purple"], // pass colours
                                })}
                            </View>
                        </Card.Content>
                    </Card>
                )
            case 3:
                return (
                    <View>
                        <TextField
                            label="Metric Name"
                            placeholder="Metric Name"
                            onChangeText={setMetricName}
                        />
                    </View>
                )
            default:
                return null;
        }
        
    };

    return (
        <View style={styles.container}>
            <Header title="New Metric" showBack customBackAction={handleBack}/>

            <View style={styles.content}>
                {renderFormStep()}

                <View alignItems={'flex-end'}>
                    <BasicButton
                        label={step < totalSteps - 1 ? "Continue" : "Finish"}
                        onPress={step < totalSteps - 1 ? handleContinue : handleFinish}
                        style={styles.button}
                    />
                </View>
            </View>    
        </View>
    )
}

export default CreateMetric;

const styles = StyleSheet.create({
    card: {
        height: 270
    },
    graphCardContainer: {
        height: "80%",
        width: "100%",
        marginTop: 12,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    text: {
        fontSize: 20,
        textAlign: "center",
        marginBottom: 20,
    },
    button: {
        marginTop: 20,
    },
});