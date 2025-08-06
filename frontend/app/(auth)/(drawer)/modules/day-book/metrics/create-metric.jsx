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
import localGraphData from './graph-data';

const CreateMetric = () => {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [dataSources, setDataSources] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [metrics] = useState(['Bar Chart', 'Line Chart', 'Pie Chart']);

const totalSteps = 2;

    useEffect(() => {
        fetchDataSources();
        fetchGraphData();
    }, []);

    const fetchDataSources = async () => {
        try {
            const response = await fetch(endpoints.modules.day_book.data_sources.getDataSources);
            const json = await response.json();
            const names = Array.isArray(json)
                ? json.map(item => item.name || item.title || "Unnamed")
                : [];

            setDataSources(names);
        } catch (error) {
            console.error("Error fetching data sources:", error);
        }
    };

    const fetchGraphData = () => {
        try {
            const formattedData = localGraphData.map(value => ({ value }));
            setGraphData(formattedData);
        } catch (error) {
            console.error('Failed to load graph data');
        }
    };

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
        }
    };

    const renderFormStep = () => {
        switch (step) {
            case 0:
                return (
                        <View>
                            <DropDown
                                title = "Select Data Source"
                                items = {dataSources}
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