// Author(s): Matthew Parkinson, Noah Bradley

import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { Text, Card, ActivityIndicator, DataTable } from "react-native-paper";
import BasicButton from "../../../../../../components/common/buttons/BasicButton";
import DropDown from '../../../../../../components/common/input/DropDown';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import TextField from '../../../../../../components/common/input/TextField';
import endpoints from '../../../../../../utils/api/endpoints';
import graphDataBySource from './graph-data';

import csvtojson from 'csvtojson';

import { list, downloadData, uploadData } from 'aws-amplify/storage';
import amplifyOutputs from '../../../../../../amplify_outputs.json'
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage"
import { ResourceSavingView } from '@react-navigation/elements';


import { CartesianChart, Line, useChartPressState, VictoryLabel } from "victory-native";
import { SharedValue } from "react-native-reanimated";
import inter from "../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import { useFont, Circle, Text as SkiaText } from "@shopify/react-native-skia";

const CreateMetric = () => {
    const router = useRouter();

    const [workspaceReadyData, setWorkspaceReadyData] = useState([]);  // Array of file paths for ready-data in the workspace
    const [loadingWorkspaceReadyData, setLoadingWorkspaceReadyData] = useState(true);  // Flag so that the program knows that the data is still being downloaded
    
    useEffect(() => {  // When page loads, get a list of URLs for all data in the workspaces' readyData folder
        async function initialiseWorkspaceReadyData() {
            const workspaceId = await getWorkspaceId();
            const filePathPrefix = `workspaces/${workspaceId}/day-book/dataSources/`
            try {
                const result = await list ({
                    path: filePathPrefix,
                    options: {
                        bucket: "workspaces",
                        //subpathStrategy: { strategy:'exclude' }
                    }
                });
                const workspaceReadyDataPaths = Array.from(new Set(  // Using a Set prevents duplicates
                    result.items.map(item => item.path
                        .split('/')  // Turn into array of each component of directory
                        .slice(0, 5)  // Keeps up to and including the dataSourceId
                        .join('/')
                        + "/data-source-data.csv"
                    )
                ));
                console.log('workspace ready data paths:', workspaceReadyDataPaths);
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
    const [loadingStoredData, setLoadingStoredData] = useState(false);  // Flag so the program knows the data is being *loaded* (not downloaded), the program has to put the data into variables
    const [dataSourceId, setDataSourceId] = useState('');

    const handleWorkspaceReadyDataSelect = async (source) => {  // When the user selects one of the data sources from the drop down, the program downloads that data
        setDataSourceId(source.split("/")[4]);
        console.log('Downloading ready data:', source);
        setReadyDataDownloadProgress(0);
        try {
            const { body } = await downloadData({
                path: source,
                options: {
                    onProgress: (progress) => {  // This continuously returns the progress as the download occurs
                        setReadyDataDownloadProgress(Math.round((progress.transferredBytes / progress.totalBytes) * 100));
                        console.log(`Download progress: ${(progress.transferredBytes/progress.totalBytes) * 100}% bytes`);
                    },
                    bucket: "workspaces"
                }
            }).result;
            setReadyDataDownloadProgress(100);  // Not necessary; just makes sure it gets set to 100% in case something weird happens
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
        } catch (error) {
            console.error('Error downloading data source:', error);
            setLoadingStoredData(false);
        }
    }


    const [metrics] = useState(['Bar Chart', 'Line Chart', 'Pie Chart']);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedReadyData, setSelectedReadyData] = useState(null);


    // This stuff is for the data preview that appears on the page
    const rowLoadAmount = 5;  // How many rows are loaded at a time in the data preview
    const [rowLimit, setRowLimit] = useState(rowLoadAmount);  // How many roads are loaded total (will update over time)
    // useMemo caches the result so that it doesn't keep recalculating
    const dataHeader = useMemo(() => storedData?.[0] ?? [], [storedData]);  // Automatically loads the first row of data as headers
    const dataRows = useMemo(() => storedData?.slice(1) ?? [], [storedData]);  // Automatically loads everything except the first row of data
    const displayedRows = useMemo(() => dataRows.slice(0, rowLimit), [dataRows, rowLimit]);  // Loads only the data that will be displayed
    const [loadingMoreRows, setLoadingMoreRows] = useState(false);

    const onPreviewBottomReached = useCallback(() => {  // When the user scrolls to the bottom, loads more rows
        if (loadingMoreRows) return;
        if (rowLimit >= dataRows.length) return;

        setLoadingMoreRows(true);
        requestAnimationFrame(() => {
            setRowLimit((prev) => Math.min(prev + rowLoadAmount, dataRows.length));
            setLoadingMoreRows(false);
        });
    }, [dataRows.length, rowLimit]);


    const { chartPressState, chartPressIsActive } = useChartPressState({ x: 0, y: {dependentVariable0: 0}})  // Loads chartPressState and chartPressIsActive based on where the user clicks on the chart
    const font = useFont(inter, 12);

    function GraphTooltip({text, xPosition, yPosition}) {  // Creates a small overlay for the graph at the specified position (usually where the user clicks)
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

    function readyDataToGraphData(rows, independentColumn, dependentColumns=[]) {  // Transforms the rows into a json object (which the graph needs)
        const output = rows.map(row => {
            let rowOutput = {independentVariable: String(row[independentColumn])}  // Issue: this doesn't sort the data, so the independentVariable can be out of order and look weird (but still correct) 
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

    const [metricName, setMetricName] = useState('');
    const [metricId, setMetricId] = useState('');
    useEffect(() => {
        setMetricId(metricName.replace(/ /g, "_"));
    }, [metricName]) 

    async function uploadInfoToDataSource() {
        const workspaceId = await getWorkspaceId();
        const S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/integrated-metrics/${metricId}`;
        const result = uploadData({
            path: S3FilePath,
            data: "",
            options: {
                bucket: 'workspaces'
            }
        })
        console.log("Metric ID uploaded to data source successfully.")
    }

    async function uploadPrunedData () {
        const workspaceId = await getWorkspaceId();
        const prunedData = {
            data: dataRows,
        }
        const S3FilePath = `workspaces/${workspaceId}/day-book/metrics/${metricId}/metric-pruned-data.json`
        const result = uploadData({
            path: S3FilePath,
            data: JSON.stringify(prunedData),
            options: {
                bucket: 'workspaces'
            }
        }).result;
        console.log("Pruned data uploaded successfully.")
    }

    async function uploadMetricSettings() {
        const workspaceId = await getWorkspaceId();
            const metricSettings = {
                independentVariable: chosenIndependentVariable,
                dependentVariables: chosenDependentVariables,
            }
            const S3FilePath = `workspaces/${workspaceId}/day-book/metrics/${metricId}/metric-settings.json`
            const result = uploadData({
                path: S3FilePath,
                data: JSON.stringify(metricSettings),
                options: {
                    bucket: "workspaces"
                }
            }).result;
            console.log("Metric settings uploaded successfully.");
        
    }

    const handleFinish = async () => {
        console.log("metric name:", metricName);
        console.log("metric id:", metricId);
        try { await uploadInfoToDataSource() } catch (error) {
            console.log("Error uploading metric id to data source:", error);
            return;
        }
        try { await uploadPrunedData() } catch (error) {
            console.log("Error uploading pruned data:", error);
            return;
        }
        try { await uploadMetricSettings() } catch (error) {
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
                            items = {loadingWorkspaceReadyData ? ["Loading..."] : workspaceReadyData.map(URL => ({value: URL, label: URL.split('/')[4]}))}
                            onSelect={(item) => handleWorkspaceReadyDataSelect(item)}
                        />

                        <DropDown
                            title = "Select Metric"
                            items = {metrics.map((metric) => ({value: metric, label: metric}))}
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
                    <View>
                        <Text>
                            Pick dependent variables and graph styling here
                        </Text>
                    </View>
                )
            case 2:
                return (
                    <View style={{height:"80%", width:"80%", marginTop:12}}>
                        <CartesianChart
                            data = {readyDataToGraphData(dataRows, chosenIndependentVariable, chosenDependentVariables)}
                            xKey = "independentVariable"
                            yKeys = {chosenDependentVariables.map((_, index) => "dependentVariable" + index) /* Just sets the yKeys to dependentVariable0, dependentVariable1, etc*/}
                            axisOptions = {{ font }}
                            chartPressState = { chartPressState /* Enables tracking where the user taps on the graph */}
                            domain = {{y:[0]} /* Forces the graph to show down to 0, even if the data is all in the 100s */}
                            renderOutside = {({ chartBounds }) => (  // This stuff has to be outside because you can't render text inside the graph
                                <>
                                    {chartPressIsActive && (  // When the user taps on the graph, this stuff is rendered
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
                                    {chosenDependentVariables.map((_, index) => {
                                        return (
                                            <Line  // Creates a line on the graph for each dependent variable
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