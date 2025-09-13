// Author(s): Matthew Parkinson, Noah Bradley

import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { Text, Card, ActivityIndicator, DataTable, Modal, Portal, Button, Chip, useTheme, IconButton } from "react-native-paper";
import BasicButton from "../../../../../../components/common/buttons/BasicButton";
import DropDown from '../../../../../../components/common/input/DropDown';
import TextField from '../../../../../../components/common/input/TextField';
import MetricCheckbox from '../../../../../../components/common/buttons/MetricCheckbox';
import MetricRadioButton from '../../../../../../components/common/buttons/MetricRadioButton';
import GraphTypes from './graph-types';

import csvtojson from 'csvtojson';

import { list, downloadData, uploadData } from 'aws-amplify/storage';
import amplifyOutputs from '../../../../../../amplify_outputs.json'
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage"
import { ResourceSavingView } from '@react-navigation/elements';
import endpoints from '../../../../../../utils/api/endpoints';
import { apiGet, apiPost } from '../../../../../../utils/api/apiClient';


import { CartesianChart, Line, useChartPressState, VictoryLabel } from "victory-native";
import { SharedValue } from "react-native-reanimated";
import inter from "../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import { useFont, Circle, Text as SkiaText } from "@shopify/react-native-skia";
import ColorPicker from 'react-native-wheel-color-picker';


const CreateMetric = () => {
    const router = useRouter();

    const [dataSourceMappings, setDataSourceMappings] = useState([]);  //Array of data source id + name pairs
    const [loadingDataSourceMappings, setLoadingDataSourceMappings] = useState(true);  // Flag so that the program knows that the data is still being downloaded
    
    useEffect(() => {  // When page loads, get a list of URLs for all data in the workspaces' readyData folder
        async function initialiseDataSourceList() {
            const workspaceId = await getWorkspaceId();
            const filePathPrefix = `workspaces/${workspaceId}/day-book/dataSources/`
            try {
                let dataSourcesFromApi = await apiGet(
                    endpoints.modules.day_book.data_sources.getDataSources,
                    { workspaceId }
                )
                setDataSourceMappings(dataSourcesFromApi.map(
                    dataSource => ({
                        id: dataSource.dataSourceId,
                        name: dataSource.name
                    })
                ));
                setLoadingDataSourceMappings(false);
            } catch (error) {
                console.error('Error retrieving ready data:', error);
                return;
            }
        }
        initialiseDataSourceList();
    }, []);


    const [dataSourceDataDownloadProgress, setDataSourceDataDownloadProgress] = useState(0);
    const [dataSourceId, setDataSourceId] = useState();  // Id of data source chosen by user
    const [dataSourceData, setDataSourceData] = useState([]);  // Data from the chosen data source
    const [dataSourceSchema, setDataSourceSchema] = useState([]);  // Data schema (aka headers) of the chosen data source
    const [dataSourceDataDownloadStatus, setDataSourceDataDownloadStatus] = useState("unstarted");  // Flag so the program knows the data is being *loaded* (not downloaded), the program has to put the data into variables

    useEffect(() => {
        console.log("Download status:", dataSourceDataDownloadStatus);
    }, [dataSourceDataDownloadStatus])

    const handleDataSourceSelect = async (source) => {  // When the user selects one of the data sources from the drop down, the program downloads that data
        console.log('Downloading ready data:', source);
        setDataSourceId(source);
        setDataSourceDataDownloadStatus("downloading");

        const workspaceId = await getWorkspaceId();
        try {
            let result = await apiGet(
                endpoints.modules.day_book.data_sources.viewData(source),
                { workspaceId }
            )
            console.log("data:", result.data);
            console.log("schema:", result.schema);
            setDataSourceData(result.data);
            setDataSourceSchema(result.schema);
            setDataSourceDataDownloadStatus("downloaded");

            /*let result = await list({  // This list function is here to get the name of the data source file. When Rhys has an endpoint for viewing the data in a data source, this won't be needed.
                path: `workspaces/${workspaceId}/day-book/dataSources/${source}/data/`,
                options: {
                    bucket: "workspaces"
                }
            })
            let S3FilePath = result.items[0].path;
            console.log("S3FilePath:", S3FilePath);

            let { body } = await downloadData({  // TODO: Replace this with endpoint call using Rhy's endpoint for viewing the data of a data source
                path: S3FilePath,
                options: {
                    onProgress: (progress) => {  // This continuously returns the progress as the download occurs
                        setDataSourceDataDownloadProgress(Math.round((progress.transferredBytes / progress.totalBytes) * 100));
                        console.log(`Download progress: ${(progress.transferredBytes/progress.totalBytes) * 100}% bytes`);
                    },
                    bucket: "workspaces"
                }
            }).result;
            setDataSourceDataDownloadProgress(100);  // Not necessary; just makes sure it gets set to 100% in case something weird happens
            setLoadingDataSourceData(true);

            const csvText = await body.text();
            console.log('Download length: ', csvText.length);
            
            const csv = require('csvtojson');
            const csvRow = await csv({
                noheader: true,
                output: 'csv',
            }).fromString(csvText)
            
            setDataSourceData(csvRow);
            setLoadingDataSourceData(false);
            console.log("Stored data length:", csvRow.length);*/
        } catch (error) {
            console.error("Error downloading data source's data:", error);
            setDataSourceDataDownloadStatus("unstarted");
        }
    }


    const [selectedMetric, setSelectedMetric] = useState(null);


    // This stuff is for the data preview that appears on the page
    const rowLoadAmount = 5;  // How many rows are loaded at a time in the data preview
    const [rowLimit, setRowLimit] = useState(rowLoadAmount);  // How many roads are loaded total (will update over time)
    // useMemo caches the result so that it doesn't keep recalculating
    const dataVariableNames = useMemo(() => dataSourceSchema.map(variable => variable.name), [dataSourceSchema]);  // Automatically loads the headers from the schema
    const dataRows = useMemo(() => dataSourceData, [dataSourceData]);  // Automatically loads everything except the first row of data
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


    const [chosenIndependentVariable, setChosenIndependentVariable] = useState([]);
    const [chosenDependentVariables, setChosenDependentVariables] = useState([]);
    const colours = ["white", "red", "blue", "green", "purple", "orange"]

    function convertToGraphData(rows) {
        let output = rows.map(row => {
            const newRow = {};
            for (const [key, value] of Object.entries(row)) {
                const valueAsNumber = Number(value);
                newRow[key] = !isNaN(number) ? valueAsNumber : value  // If the value can be turned into a number, do so
            }
            return newRow;
        })
        console.log("output:", output);
        return output;
    }


    const [step, setStep] = useState(0);
    const totalSteps = 2;

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
    const [metricId, setMetricId] = useState('');  //TODO: replace metricId stuff with instead getting the metricId from the create metric endpoint (which creates an id for it)
    useEffect(() => {
        setMetricId(metricName.replace(/ /g, "_"));
    }, [metricName]) 

    async function uploadInfoToDataSource() {
        const workspaceId = await getWorkspaceId();
        const S3FilePath = `workspaces/${workspaceId}/day-book/dataSources/${dataSourceId}/integrated-metrics/${metricId}`;
        let result = uploadData({
            path: S3FilePath,
            data: "",
            options: {
                bucket: 'workspaces'
            }
        })
        console.log("Metric ID uploaded to data source successfully.")
    }

    async function uploadPrunedData () {  //TODO: needs to be updated to use endpoints
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

    async function uploadMetricSettings() {  //TODO: needs to be updated to use endpoints
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
        let workspaceId = await getWorkspaceId();

        // Upload metric details
        try {
            let metricDetails = {
                name: metricName,
                dataSourceId: dataSourceId,
                config: {
                    type: selectedMetric,
                    //data: dataRows,  // TODO: implement separate function using an endpoint to upload the data to S3
                    independentVariable: chosenIndependentVariable,
                    dependentVariables: chosenDependentVariables,
                    colours: coloursState,
                }
            }
            let result = await apiPost(
                endpoints.modules.day_book.metrics.add,
                metricDetails,
                { workspaceId }
            );
            console.log("Uploading metric details via API result:", result);
        } catch (error) {
            console.log("Error uploading metric details via API:", error);
            return;
        }
        //TODO: Upload metric details to the data source as well

        //TODO: Upload metric pruned data

        /*try { await uploadInfoToDataSource() } catch (error) {
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
        }*/   
        
        console.log("Form completed");
        //router.navigate("/modules/day-book/metrics/metric-management"); 
        router.back(); //TODO: Figure out why .navigate() isn't doing this? Why do we need this workaround?
    }

    const [dataVisible, setDataVisible] = React.useState(false);
    const showDataModal = () => {
        setDataVisible(true);
    }
    const hideDataModal = () => setDataVisible(false);

    const [graphVisible, setGraphVisible] = React.useState(false);
    const showGraphModal = () => setGraphVisible(true);
    const hideGraphModal = () => setGraphVisible(false);

    const [selectedColor, setSelectedColor] = useState("#ffffffff");
    const [coloursState, setColoursState] = useState(["red", "blue", "green", "purple"]);
    const [activeDepVar, setActiveDepVar] = useState(0);
    const [wheelIndex, setWheelIndex] = useState(0);

    const renderFormStep = () => {
        switch (step) {
            case 0:
                return (
                    <ScrollView>
                        <DropDown
                            title = "Select Data Source"
                            items = {loadingDataSourceMappings ? ["Loading..."] : dataSourceMappings.map(dataSource => ({value: dataSource.id, label: dataSource.name}))}
                            onSelect={(item) => handleDataSourceSelect(item)}
                        />

                        <Button icon="file" mode="text" onPress={showDataModal}>
                            Validate Data
                        </Button>

                        <DropDown
                            title = "Select Metric"
                            items={Object.values(GraphTypes).map((g) => ({
                                value: g.value,
                                label: g.label,
                            }))}
                            showRouterButton={false}
                            onSelect={(item) => setSelectedMetric(item)}
                        />

                        <Text>Select Independent Variable (X-Axis)</Text>
                        <MetricRadioButton
                            items={dataVariableNames}
                            selected={chosenIndependentVariable}
                            onChange={(selection) => {
                                setChosenIndependentVariable(selection);
                            }}
                        />

                        <Text style={{ marginTop: 12 }}>Select Dependent Variables (Y-Axis)</Text>
                        <MetricCheckbox
                            items={dataVariableNames}
                            selected={chosenDependentVariables}
                            onChange={(selection) => {
                                // Convert names back into indices
                                setChosenDependentVariables(selection);
                            }}
                        />
                                                   
                        <Portal>
                            <Modal 
                                visible={dataVisible} 
                                onDismiss={hideDataModal} 
                                style={styles.modalContainer}
                            >
                                <Card style={styles.card}>
                                    <Card.Content>
                                        {dataSourceDataDownloadStatus == "unstarted" && (
                                            <Text>No data source selected</Text>
                                        )}
                                        {dataSourceDataDownloadStatus == "downloading" && (
                                            <ActivityIndicator size="large" color="#0000ff" />
                                        )}
                                        {dataSourceDataDownloadStatus == "downloaded" && (
                                            <ScrollView horizontal
                                                showsHorizontalScrollIndicator
                                            >
                                                <View style={{ minWidth: (dataVariableNames.length) * 100 }}>
                                                    <DataTable>{/* Displays a preview of the data as a table */} 
                                                        <DataTable.Header>
                                                            {dataVariableNames.map((variableName, index) => (
                                                                <DataTable.Title key={index} numberOfLines={1}>
                                                                    <Text>{String(variableName)}</Text>
                                                                </DataTable.Title>
                                                            ))}
                                                        </DataTable.Header>
                                                        <FlatList
                                                            data={displayedRows}
                                                            renderItem={({ item }) => (
                                                                <DataTable.Row>
                                                                    {dataVariableNames.map((variableName, index) => (
                                                                        <DataTable.Cell key={index} style={{ width: 100 }} numberOfLines={1}>
                                                                            <Text>{String(item[variableName])}</Text>
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
                            </Modal>
                        </Portal>
                    </ScrollView>
                )
            case 1:
                const graphDef = GraphTypes[selectedMetric]; // Get chosen graph definition
                if (!graphDef) {
                    return <Text>Please select a metric to preview</Text>;
                }

                const handleColorChange = (color) => {
                    setSelectedColor(color);
                    // For now, replace the first colour (or you could extend this to pick which line to recolor)
                    const updated = [...coloursState];
                    updated[0] = color;
                    setColoursState(updated);
                };

                return (
                    <ScrollView>
                        <TextField
                            label="Metric Name"
                            placeholder="Metric Name"
                            onChangeText={setMetricName}
                        />
                        
                        {/* Variable selector chips */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginVertical: 10 }}>
                            {chosenDependentVariables.map((variable, index) => (
                                <Chip
                                    key={variable}
                                    selected={wheelIndex === index}
                                    onPress={() => setWheelIndex(index)}
                                    style={{ margin: 4 }}
                                >
                                    {variable ?? `Y${index + 1}`}
                                </Chip>
                            ))}
                        </View>
                        
                        {/* Single colour picker for the active variable */}
                        <View style={{ marginTop: 10, alignItems: "center" }}>
                            <ColorPicker
                                color={coloursState[wheelIndex]}
                                onColorChange={(newColor) => {
                                    setColoursState((prev) => {
                                        const updated = [...prev];
                                        updated[wheelIndex] = newColor;
                                        return updated;
                                    });
                                }}
                                thumbSize={30}
                                sliderSize={30}
                                noSnap={true}
                                row={true}
                            />
                        </View>
                        
                        {/* Graph preview */}
                        <Card style={[styles.card, { marginTop: 20 }]}>
                            <Card.Content>
                                <View style={styles.graphCardContainer}>
                                    {graphDef.render({
                                        data: convertToGraphData(dataRows),
                                        xKey: chosenIndependentVariable,
                                        yKeys: chosenDependentVariables,
                                        colours: coloursState, // dynamic per-variable colours
                                    })}
                                </View>
                            </Card.Content>
                        </Card>

                        
                    </ScrollView>
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
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        height: 270,
        marginTop: 20,
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