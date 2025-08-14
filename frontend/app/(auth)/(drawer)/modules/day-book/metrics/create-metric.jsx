// Author(s): Matthew Parkinson, Noah Bradley

import { View, StyleSheet } from 'react-native';
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { Text, Card } from "react-native-paper";
import BasicButton from "../../../../../../components/common/buttons/BasicButton";
import DropDown from '../../../../../../components/common/input/DropDown';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import TextField from '../../../../../../components/common/input/TextField';
import endpoints from '../../../../../../utils/api/endpoints';
import graphDataBySource from './graph-data';

import { list } from 'aws-amplify/storage';
import awsmobile from '../../../../../../src/aws-exports';

const CreateMetric = () => {
    
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [dataSources, setDataSources] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedDataSource, setSelectedDataSource] = useState(null);
    const [metrics] = useState(['Bar Chart', 'Line Chart', 'Pie Chart']);

    const totalSteps = 2;

    /*useEffect(() => {
        const sources = Object.keys(graphDataBySource);
        setDataSources(sources);
    }, []);*/

    const handleDataSourceSelect = (source) => {
        setSelectedDataSource(source);
        const formattedData = graphDataBySource[source]?.map(value => ({ value })) || [];
        setGraphData(formattedData);
    };

    useEffect(() => {
        async function initialiseStoredData() {
            const result = await list ({
                path: "public/",
                options: {
                    bucket: {
                        bucketName: 'workspace-stored-data1858d-dev',
                        region: awsmobile.aws_project_region,
                    }
                }
            })
            console.log('Data sources retrieved:', result.items.map(item => item.path));
            sources = result.items.map(item => item.path);
            setDataSources(sources);
            console.log(dataSources.map(item => item.split('/').at(-1)))
        }
            
        initialiseStoredData();
    }, []);

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
                                items = {dataSources.map(item => item.split('/').at(-1))}
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
                                    {!selectedMetric && (
                                        <Text>Show file preview here</Text>
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