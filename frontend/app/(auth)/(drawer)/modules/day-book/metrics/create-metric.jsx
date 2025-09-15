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

import { list, downloadData, uploadData } from 'aws-amplify/storage';
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage"
import endpoints from '../../../../../../utils/api/endpoints';
import { apiGet, apiPost } from '../../../../../../utils/api/apiClient';


import { useChartPressState } from "victory-native";
import inter from "../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import { useFont, Circle, Text as SkiaText } from "@shopify/react-native-skia";
import ColorPicker from 'react-native-wheel-color-picker';


const CreateMetric = () => {
    const router = useRouter();
    const theme = useTheme();

    const [dataSourceMappings, setDataSourceMappings] = useState([]);  //Array of data source id + name pairs
    const [loadingDataSourceMappings, setLoadingDataSourceMappings] = useState(true);  // Flag so that the program knows that the data is still being downloaded
    
    useEffect(() => {  // When page loads, load a list of all data sources
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


    const [dataSourceId, setDataSourceId] = useState();  // Id of data source chosen by user
    const [dataSourceData, setDataSourceData] = useState([]);  // Data from the chosen data source
    const [dataSourceVariableNames, setDataSourceVariableNames] = useState([])
    const [dataSourceDataDownloadStatus, setDataSourceDataDownloadStatus] = useState("unstarted");  // Flag so the program knows the data is being *loaded* (not downloaded), the program has to put the data into variables

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
            setDataSourceData(result.data);
            setDataSourceVariableNames(result.schema.map(variable => variable.name));
            setDataSourceDataDownloadStatus("downloaded");
        } catch (error) {
            console.error("Error downloading data source's data:", error);
            setDataSourceDataDownloadStatus("unstarted");
        }
    }


    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedReadyData, setSelectedReadyData] = useState(null);

    // This stuff is for the data preview that appears on the page
    const rowLoadAmount = 5;  // How many rows are loaded at a time in the data preview
    const [rowLimit, setRowLimit] = useState(rowLoadAmount);  // How many roads are loaded total (will update over time)
    const displayedRows = useMemo(() => dataSourceData.slice(0, rowLimit), [dataSourceData, rowLimit]);  // Loads only the data that will be displayed in the "view data" popup
    const [loadingMoreRows, setLoadingMoreRows] = useState(false);

    const onPreviewBottomReached = useCallback(() => {  // When the user scrolls to the bottom, loads more rows
        if (loadingMoreRows) return;
        if (rowLimit >= dataSourceData.length) return;

        setLoadingMoreRows(true);
        requestAnimationFrame(() => {
            setRowLimit((prev) => Math.min(prev + rowLoadAmount, dataSourceData.length));
            setLoadingMoreRows(false);
        });
    }, [dataSourceData.length, rowLimit]);


    /*const { chartPressState, chartPressIsActive } = useChartPressState({ x: 0, y: {dependentVariable0: 0}})  // Loads chartPressState and chartPressIsActive based on where the user clicks on the chart
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
    }*/


    function convertToGraphData(rows) {
        let output = rows.map(row => {
            const newRow = {};
            for (const [key, value] of Object.entries(row)) {
                const valueAsNumber = Number(value);
                newRow[key] = !isNaN(valueAsNumber) ? valueAsNumber : value  // If the value can be turned into a number, do so
            }
            return newRow;
        })
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

    /*async function uploadInfoToDataSource() {
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
    }*/

    /*async function uploadPrunedData () {  //TODO: needs to be updated to use endpoints
        const workspaceId = await getWorkspaceId();
        const prunedData = {
            data: dataSourceData,
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
    }*/

    async function uploadMetricSettings() {
        console.log("Uploading metric details...");
        if (!metricName) {
            throw new Error("Metric is missing a name.")
        }

        let workspaceId = await getWorkspaceId();
        let metricDetails = {
            name: metricName,
            dataSourceId: dataSourceId,
            config: {
                type: selectedMetric,
                //data: dataSourceData,  // TODO: implement separate function using an endpoint to upload the pruned data to S3
                independentVariable: chosenIndependentVariable,
                dependentVariables: chosenDependentVariables,
                colours: coloursState,
                //selectedRows,  // TODO: implement separate function to prune the data when it gets uploaded
            }
        }
        let result = await apiPost(
            endpoints.modules.day_book.metrics.add,
            metricDetails,
            { workspaceId }
        );
        console.log("Uploaded metric details via API result:", result);
    }

    const handleFinish = async () => {
        
        //TODO: Upload metric details to the data source as well

        //TODO: Upload metric pruned data

        /*try { await uploadInfoToDataSource() } catch (error) {
            console.log("Error uploading metric id to data source:", error);
            return;
        }
        try { await uploadPrunedData() } catch (error) {
            console.log("Error uploading pruned data:", error);
            return;
        }*/
        try { await uploadMetricSettings() } catch (error) {
            console.log("Error uploading metric settings:", error);
            return;
        }  
        
        console.log("Form completed");
        //router.navigate("/modules/day-book/metrics/metric-management"); 
        router.back(); //TODO: Figure out why .navigate() isn't doing this? Why do we need this workaround?
    }

    const [dataVisible, setDataVisible] = React.useState(false);
    const showDataModal = () => {setDataVisible(true)};
    const hideDataModal = () => setDataVisible(false);

    const [showChecklist, setShowChecklist] = useState(false);

    const [chosenIndependentVariable, setChosenIndependentVariable] = useState([]);
    const [chosenDependentVariables, setChosenDependentVariables] = useState([]);
    const [coloursState, setColoursState] = useState(["red", "blue", "green", "purple"]);
    const [wheelIndex, setWheelIndex] = useState(0);
    const [metricName, setMetricName] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);

    const renderFormStep = () => {
        switch (step) {
            case 0:
                return (
                    <ScrollView>
                        <DropDown
                            title = "Select Data Source"
                            items = {loadingDataSourceMappings ? ["Loading..."] : dataSourceMappings.map(dataSource => ({value: dataSource.id, label: dataSource.name}))}
                            onSelect={(item) => {
                                handleDataSourceSelect(item);
                                setSelectedReadyData(item);
                            }}
                            value = {selectedReadyData}
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
                            value={selectedMetric}
                        />

                        <Text>Select Independent Variable (X-Axis)</Text>
                        <MetricRadioButton
                            items={dataSourceVariableNames}
                            selected={chosenIndependentVariable}
                            onChange={(selection) => {
                                setChosenIndependentVariable(selection);
                            }}
                        />

                        <Text style={{ marginTop: 12 }}>Select Dependent Variables (Y-Axis)</Text>
                        {["bar", "pie"].includes(selectedMetric) ? (
                            <MetricRadioButton
                                items={dataSourceVariableNames}
                                selected={chosenDependentVariables}
                                onChange={(selection) => {
                                    setChosenDependentVariables(selection);
                                }}
                            />
                        ) : (
                            <MetricCheckbox
                                items={dataSourceVariableNames}
                                selected={chosenDependentVariables}
                                onChange={(selection) => {
                                    setChosenDependentVariables(selection);
                                }}
                            />
                        )}

                        {/* Row Selection */}
                        <View 
                            style={{ 
                                flexDirection: "row", 
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: -7
                            }}
                        >
                            <Text>Select Data Points (Optional)</Text>
                            
                            <Chip
                                onPress={() => {
                                    if (selectedRows.length === dataSourceData.length) {
                                        setSelectedRows([]);
                                    } else {
                                        setSelectedRows(dataSourceData.map((row) => row[0]));
                                    }
                                }}
                                style={{
                                    backgroundColor: theme.colors.background,
                                }}
                                textStyle={{
                                    color: theme.colors.primary
                                }}
                            >
                                {selectedRows.length === dataSourceData.length ? "Deselect All" : "Select All"}
                            </Chip>

                            <IconButton
                                icon={showChecklist ? "chevron-up" : "chevron-down"}
                                size={20}
                                onPress={() => setShowChecklist(!showChecklist)}
                            />
                        </View>

                        {showChecklist && (
                            <MetricCheckbox
                                items={dataSourceData.map((row) => row[0])} // use first column (e.g. Name)
                                selected={selectedRows}
                                onChange={(selection) => setSelectedRows(selection)}
                            />
                        )}
                                                   
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
                                                <View style={{ minWidth: (dataSourceVariableNames.length) * 100 }}>
                                                    <DataTable>{/* Displays a preview of the data as a table */} 
                                                        <DataTable.Header>
                                                            {dataSourceVariableNames.map((variableName, index) => (
                                                                <DataTable.Title key={index} numberOfLines={1}>
                                                                    <Text>{String(variableName)}</Text>
                                                                </DataTable.Title>
                                                            ))}
                                                        </DataTable.Header>
                                                        <FlatList
                                                            data={displayedRows}
                                                            renderItem={({ item }) => (
                                                                <DataTable.Row>
                                                                    {dataSourceVariableNames.map((variableName, index) => (
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

                const filteredRows = dataSourceVariableNames.filter(
                    (row) => selectedRows.includes(row[0]) // assumes first column is "Name"
                );

                return (
                    <ScrollView>
                        <TextField
                            label="Metric Name"
                            placeholder="Metric Name"
                            onChangeText={setMetricName}
                            value={metricName}
                        />
                        
                        {/* Variable selector chips */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 10 }}>
                            {chosenDependentVariables.map((variable, index) => (
                                <Chip
                                    key={variable}
                                    selected={wheelIndex === index}
                                    onPress={() => setWheelIndex(index)}
                                    style={{ 
                                        margin: 4,
                                        backgroundColor: wheelIndex === index ? theme.colors.primary : theme.colors.placeholder,
                                    }}
                                    showSelectedCheck = {false}
                                >
                                    {variable ?? `Y${index + 1}`}
                                </Chip>
                            ))}
                        </View>
                        
                        {/* Single colour picker for the active variable */}
                        <View style={{ marginTop: 10, justifyContent: "center", flexDirection: "row" }}>
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
                                gapSize={10}
                                palette={['#000000','#ed1c24','#d11cd5','#2b5fceff','#57ff0a','#ffde17','#f26522','#888888']}
                            />
                        </View>
                        
                        {/* Graph preview */}
                        <Card style={[styles.card]}>
                            <Card.Content>
                                <View style={styles.graphCardContainer}>
                                    {graphDef.render({
                                        data: convertToGraphData(dataSourceData),
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
        height: 260,
        marginTop: 20,
    },
    graphCardContainer: {
        height: "100%",
        width: "100%",
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