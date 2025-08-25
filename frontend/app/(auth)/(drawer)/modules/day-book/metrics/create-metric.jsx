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

import { list, downloadData } from 'aws-amplify/storage';
import amplifyOutputs from '../../../../../../amplify_outputs.json'
import { ResourceSavingView } from '@react-navigation/elements';


import { CartesianChart, Line, useChartPressState, VictoryLabel } from "victory-native";
import { SharedValue } from "react-native-reanimated";
import inter from "../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";
import { useFont, Circle, Text as SkiaText } from "@shopify/react-native-skia";

const CreateMetric = () => {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [dataSources, setDataSources] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedDataSource, setSelectedDataSource] = useState(null);
    const [loadingDataSources, setLoadingDataSources] = useState(true);
    const [metrics] = useState(['Bar Chart', 'Line Chart', 'Pie Chart']);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const [loadingStoredData, setLoadingStoredData] = useState(false);
    const [storedData, setStoredData] = useState(null);

    const totalSteps = 2;

    const [rowLimit, setRowLimit] = useState(5);
    const headerRows = useMemo(() => storedData?.[0] ?? [], [storedData]);
    const allRows = useMemo(() => storedData?.slice(1) ?? [], [storedData]);
    const displayedRows = useMemo(() => allRows.slice(0, rowLimit), [allRows, rowLimit]);
    const [loadingMoreRows, setLoadingMoreRows] = useState(false);
    
    const onBottomReached = useCallback(() => {
        if (loadingMoreRows) return;
        if (allRows.length <= rowLimit) return;

        setLoadingMoreRows(true);
        requestAnimationFrame(() => {
            setRowLimit((prev) => Math.min(prev + 10, allRows.length));
            setLoadingMoreRows(false);
        });
    }, [allRows.length, rowLimit, loadingMoreRows]);

    const { state, isActive } = useChartPressState({ x: 0, y: {value1: 0, value2: 0}})
    const font = useFont(inter, 12);

    function ToolTip({text, xPosition, yPosition}) {
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

    function tableToGraph(headers, rows, key1, key2) {
        if (!Array.isArray(rows)) return [];
        
        const output = rows
        .filter((row) =>
            row?.[key1] != null &&
            row?.[key2] != null
        )
        .map((row) => ({
            label: String(row[0]),
            value1: Number(row[key1]),
            value2: Number(row[key2]),
            
        }))
        return output;
    }

    /*useEffect(() => {
        const sources = Object.keys(graphDataBySource);
        setDataSources(sources);
    }, []);*/

    /*const handleDataSourceSelect = (source) => {
        setSelectedDataSource(source);
        const formattedData = graphDataBySource[source]?.map(value => ({ value })) || [];
        setGraphData(formattedData);
    };*/

    useEffect(() => {
        if (storedData) {
            console.log("Stored data updated. Length:", storedData.length);
        }
    }, [storedData]);

    useEffect(() => {
        async function initialiseStoredData() {
            try {
                const result = await list ({
                    path: "public/",
                    options: {
                        bucket: {
                            bucketName: 'workspace-stored-data1858d-dev',
                            region: amplifyOutputs.storage.aws_region,
                        }
                    }
                })
                const sources = result.items.map(item => item.path);
                setDataSources(sources);
                setLoadingDataSources(false);
            } catch (error) {
                console.error('Error retrieving data sources:', error);
                return;
            }
            //console.log('Data sources retrieved:', result.items.map(item => item.path));
        }

        initialiseStoredData();
    }, []);

    const handleDataSourceSelect = async (source) => {
        console.log('Downloading data source:', source);
        setDownloadProgress(0);
        try {
            const { body, eTag } = await downloadData({
                path: source,
                options: {
                    onProgress: (progress) => {
                        setDownloadProgress(Math.round((progress.transferredBytes / progress.totalBytes) * 100));
                        console.log(`Download progress: ${(progress.transferredBytes/progress.totalBytes) * 100}% bytes`);
                    },
                    bucket: {
                        bucketName: 'workspace-stored-data1858d-dev',
                        region: amplifyOutputs.storage.aws_region,
                    }
                }
            }).result
            setDownloadProgress(100)
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

    const handleBack = () => {
        if (step === 0) {
            router.back();
        } else {
            setStep((prev) => prev - 1);
        }
    };

    const handleContinue = () => {
        if (step < totalSteps - 1) {
            setStep((prev) => prev + 1);
        } else {
            console.log("Form completed");
            router.navigate("/modules/day-book/metrics/metric-management");
        }
    };

    const renderFormStep = () => {
        switch (step) {
            case 0:
                return ( <>
                    <View style={{height:220, marginTop:12}}>
                        <CartesianChart
                            data={tableToGraph(headerRows, allRows, 1, 2)}
                            xKey="label"
                            yKeys={['value1', 'value2']}
                            axisOptions={{ font }}
                            chartPressState={state}
                            domain = {{y:[0]}}
                            renderOutside={({ chartBounds }) => (
                                <>
                                    {console.log("state.y.value1.position.value:", state.y.value1.position.value)}
                                    {console.log("state.x.position.value:", state.x.position.value)}
                                    {isActive && (
                                        <>
                                            <ToolTip
                                                //text={state.y.value2.value.value}
                                                xPosition={state.x.position.value}
                                                yPosition={state.y.value1.position.value}
                                            />
                                        </>
                                    )}
                                    {console.log("working?")}
                                </>
                            )}
                        >
                            {({ points }) => (
                                <>
                                    <Line
                                        points={points.value1}
                                        color="white"
                                        strokeWidth={3}
                                    />
                                    <Line
                                        points={points.value2}
                                        color="blue"
                                        strokeWidth={3}
                                    />
                                    
                                    {isActive ? (
                                        <>
                                            
                                        </>
                                    ) : null}
                                </>
                            )}
                        </CartesianChart>
                    </View>
                    <ScrollView>
                        <DropDown
                            title = "Select Data Source"
                            items = {loadingDataSources ? ["Loading..."] : dataSources/*.map(item => item.split('/').at(-1))*/} //commented out code just shows the path, but we need the full path to download the file
                            onSelect={handleDataSourceSelect}
                        />

                        <DropDown
                            title = "Select Metric"
                            items = {metrics}
                            showRouterButton={false}
                            onSelect={(item) => setSelectedMetric(item)}
                        />
                        
                        
                                                   
                        <Card style={styles.card}>
                            <Card.Content>
                                {selectedMetric === 'Bar Chart' && (
                                    <BarChart data={graphData} />
                                )}
                                {selectedMetric === 'Line Chart' && (
                                    <LineChart data={graphData} />
                                )}
                                {selectedMetric === 'Pie Chart' && (
                                    <PieChart data={graphData} />
                                )}
                                {!selectedMetric && downloadProgress == 0 && (
                                    <Text>Display preview here</Text>
                                )}
                                {!selectedMetric && downloadProgress > 0 && (
                                    <Text>Downloading data source: {downloadProgress}%</Text>
                                )}
                                {!selectedMetric && downloadProgress == 100 && loadingStoredData && (
                                    <ActivityIndicator size="large" color="#0000ff" />
                                )}
                                {!selectedMetric && downloadProgress == 100 && !loadingStoredData && (
                                    <ScrollView horizontal
                                        showsHorizontalScrollIndicator
                                    >
                                        <View style={{ minWidth: (headerRows?.length ?? 0) * 100 }}>
                                            <DataTable>
                                                <DataTable.Header>
                                                    {headerRows.map((header, index) => (
                                                        <DataTable.Title key={index} numberOfLines={1}>
                                                            {String(header)}
                                                        </DataTable.Title>
                                                    ))}
                                                </DataTable.Header>
                                                <FlatList
                                                    data={displayedRows}
                                                    renderItem={({ item }) => (
                                                        <DataTable.Row>
                                                            {item.map((cell, index) => (
                                                                <DataTable.Cell key={index} style={{ width: 100 }} numberOfLines={1}>
                                                                    {String(cell)}
                                                                </DataTable.Cell>
                                                            ))}
                                                        </DataTable.Row>
                                                    )}
                                                    nestedScrollEnabled={true}
                                                    style={{ maxHeight: 180 /*shouldn't be hardcoded*/}}
                                                    initialNumToRender={5}
                                                    windowSize={10}
                                                    removeClippedSubviews={true}
                                                    onEndReached={onBottomReached}
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
                </>)
            case 1:
                return (
                    <View>
                        <TextField
                            label="Metric Name"
                            placeholder="Metric Name"
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
                        onPress={handleContinue}
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