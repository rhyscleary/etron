import { View, StyleSheet } from 'react-native';
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Header from "../components/layout/Header";
import { Text, Card } from "react-native-paper";
import BasicButton from "../components/common/buttons/BasicButton";
import DropDown from '../components/common/input/DropDown';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

//const BACKEND_BASE_URL = 'http//...';

const CreateMetric = () => {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const dataSources = ['Data Source 1', 'Data Source 2', 'Data Source 3' ];
    //const [dataSources, setDataSources] = useState([]);
    const graphData = [ {value: 50}, {value: 80}, {value: 90}, {value: 70} ];
    //const [graphData, setGraphData] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const metrics = [ 'Metric 1' , 'Metric 2', 'Metric 3' ];

    const totalSteps = 2;

    /*

    useEffect(() => {
        fetchDataSources();
        fetchGraphData();
    }, []);

    const fetchDataSources = async () => {
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/data-sources`);
            const json = await response.json();
            setDataSources(json);
        } catch (error) {
            console.error("Error fetching data sources:", error);
        }
    };

    const fetchGraphData = async () => {
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/graph-data`);
            const json = await response.json();
            setGraphData(json);
        } catch (error) {
            console.error("Error fetching graph data:", error);
        }
    };

    */

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

                            <Card>
                                <Card.Content>
                                    {selectedMetric === 'Metric 1' && (
                                        <BarChart data={graphData} />
                                    )}
                                    {selectedMetric === 'Metric 2' && (
                                        <LineChart data={graphData} />
                                    )}
                                    {selectedMetric === 'Metric 3' && (
                                        <PieChart data={[
                                            {value: 50, color: 'red'},
                                            {value: 30, color: 'blue'},
                                            {value: 20, color: 'green'},
                                        ]} />
                                    )}
                                </Card.Content>
                            </Card>
                        </View>
                )
            case 1:
                return (
                    <View>
                        <Text style={styles.text}>Page 2</Text>
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