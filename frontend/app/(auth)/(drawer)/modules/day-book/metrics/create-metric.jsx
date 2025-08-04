import { View, StyleSheet, SafeAreaView } from 'react-native';
import React, { useState } from "react";
import { useRouter } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { Text } from "react-native-paper";
import BasicButton from "../../../../../../components/common/buttons/BasicButton";
import DropDown from '../../../../../../components/common/input/DropDown';

const CreateMetric = () => {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const dataSources = ['Data Source 1', 'Data Source 2', 'Data Source 3' ];
    const metrics = ['Metric 1', 'Metric 2', 'Metric 3' ];

    const totalSteps = 2;

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
                            />

                            <View>
                                
                            </View>
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

                <BasicButton
                    label={step < totalSteps - 1 ? "Continue" : "Finish"}
                    onPress={handleContinue}
                    fullWidth
                    style={styles.button}
                />
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