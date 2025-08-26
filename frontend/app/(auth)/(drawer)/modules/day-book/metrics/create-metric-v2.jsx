import { View, StyleSheet, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { Text, Card } from "react-native-paper";
import BasicButton from "../../../../../../components/common/buttons/BasicButton";
import DropDown from "../../../../../../components/common/input/DropDown";
import TextField from "../../../../../../components/common/input/TextField";
import endpoints from "../../../../../../utils/api/endpoints";
import localGraphData from "./graph-data";
import CustomRadioButton from "../../../../../../components/common/buttons/CustomRadioButton.jsx";

import { chartRegistry } from "./chart-registry";
import { transformData } from "./transform-data";

const CreateMetric = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // dropdown + selection states
  const [dataSources, setDataSources] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [graphData, setGraphData] = useState([]);

  const [selectedMetric, setSelectedMetric] = useState(null);
  const [valueToTrack, setValueToTrack] = useState("X only");
  const [dateRange, setDateRange] = useState("Last 24h");
  const [dimensions, setDimensions] = useState(10);

  const [metrics] = useState(["Bar Chart", "Line Chart", "Pie Chart"]);
  const totalSteps = 2;

  // initial fetches
  useEffect(() => {
    fetchDataSources();
    fetchGraphData();
  }, []);

      // whenever filters change → transform data
  useEffect(() => {
    const transformed = transformData(rawData, valueToTrack, dateRange, dimensions);
    setGraphData(transformed);
  }, [rawData, valueToTrack, dateRange, dimensions]);

  const fetchDataSources = async () => {
    try {
      const response = await fetch(endpoints.modules.day_book.data_sources.getDataSources);
      const json = await response.json();
      const names = Array.isArray(json)
        ? json.map((item) => item.name || item.title || "Unnamed")
        : [];
      setDataSources(names);
    } catch (error) {
      console.error("Error fetching data sources:", error);
    }
  };

  const fetchGraphData = () => {
    try {
      // example: {timestamp, x, y}
      setRawData(localGraphData);
    } catch (error) {
      console.error("Failed to load graph data");
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
                        <ScrollView contentContainerStyle={{ padding: 16 }}>
                            <View>
                                <CustomRadioButton 
                                    title = "Choose Metric Type"
                                    value = {2}
                                    options = 
                                            {[
                                                "New metric from data source or new dimensional metric from existing metrics", 
                                                "New calculated metric using only existing metrics"
                                            ]}
                                />
                                
                                <DropDown
                                    title = "Select Data Source"
                                    items = {dataSources}
                                />

                                <CustomRadioButton
                                    title="Select Value to Track"
                                    value={3}
                                    options={["X only", "Y only", "X and Y"]}
                                    onChange={setValueToTrack}
                                />

                                <CustomRadioButton
                                  title="Select Date Range"
                                  value={3}
                                  options={["Last Hour", "Last 24h", "Last 7d"]}
                                  onChange={setDateRange}
                                />

                                <DropDown
                                    title = "Select Metric"
                                    items = {metrics}
                                    showRouterButton={false}
                                    onSelect={(item) => setSelectedMetric(item)}
                                />

                                <CustomRadioButton
                                    title="Dimensions"
                                    value={3}
                                    options={["5", "10", "20"]}
                                    onChange={(val) => setDimensions(Number(val))}
              />

                                <Card style={styles.card}>
                <Card.Content>
                  {selectedMetric && chartRegistry[selectedMetric] && (
                    React.createElement(chartRegistry[selectedMetric], { data: graphData })
                  )}
                </Card.Content>
              </Card>
                            </View>
                        </ScrollView>
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