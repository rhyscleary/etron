// Author(s): Matthew Parkinson, Noah Bradley

import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import React, { useState, useEffect, use } from "react";
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
import awsmobile from '../../../../../../src/aws-exports';
import { ResourceSavingView } from '@react-navigation/elements';

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
                            region: awsmobile.aws_project_region,
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
                        region: awsmobile.aws_project_region,
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
            router.push("/modules/day-book/metrics/metric-management");
        }
    };

    const renderFormStep = () => {
        switch (step) {
            case 0:
                return (
                    <View>
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
                                        <ScrollView
                                            nestedScrollEnabled
                                            showsVerticalScrollIndicator
                                            style={{ maxHeight: 260 }}  //shouldn't be hardcoded like this, but fit to the screen
                                        >
                                            {/*<FlatList
                                                data = {storedData}
                                                numColumns = {storedData.length}
                                                keyExtractor={(item, index) => index.toString()}
                                                renderItem={({ item }) => (
                                                    <View>
                                                        {item.map((cell, cellIndex) => (
                                                            <Text key={cellIndex}>
                                                                {cell}
                                                            </Text>
                                                        ))}
                                                    </View>
                                                )}
                                            />*/}
                                            <DataTable>
                                                <DataTable.Header>
                                                    {(storedData[0] ?? []).map((header, index) => (
                                                        <DataTable.Title key={index}
                                                            numberOfLines={1}
                                                            style={{width: 100}}  //shouldn't be hardcoded like this, but fit to the screen
                                                        >
                                                            {String(header)}
                                                        </DataTable.Title>
                                                    ))}
                                                </DataTable.Header>
                                                {(storedData.slice(1) ?? []).map((row, index) => (
                                                    <DataTable.Row key = {index}>
                                                        {row.map((cell, cellIndex) => (
                                                            <DataTable.Cell key={cellIndex}
                                                                numberOfLines={1}
                                                                style={{width: 100}}  //shouldn't be hardcoded like this, but fit to the screen
                                                            >
                                                                {String(cell)}
                                                            </DataTable.Cell>
                                                        ))}
                                                    </DataTable.Row>
                                                ))}
                                            </DataTable>
                                        </ScrollView>
                                    </ScrollView>
                                )}

                            </Card.Content>
                        </Card>
                    </View>
                )
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