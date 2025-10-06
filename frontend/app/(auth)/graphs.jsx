//TEMP FILE; REMOVE WHEN FUNCTIONALITY IS IMPLEMENTED ELSEWHERE

import { Button, Text, View, ScrollView } from 'react-native';
import { commonStyles } from '../../assets/styles/stylesheets/common';
import { router } from "expo-router";
import Header from '../../components/layout/Header';
import StackLayout from '../../components/layout/StackLayout';
import { Pressable } from 'react-native';
import { BarChart, LineChart, PieChart, PopulationPyramid, RadarChart } from "react-native-gifted-charts";

const graphs = () => {
    const data=[ {value:50}, {value:80}, {value:90}, {value:70} ]

    return (
        <View>
            <Header title="Graphs" showMenu/>
            
            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={34}>
                    {/*Temporary redirect to profile screen*/}
                    <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/dashboard")} />
                    <BarChart data = {data} />
                    <LineChart data = {data} />
                    <PieChart data = {data} />
                    <PopulationPyramid data = {[{left:10,right:12}, {left:9,right:8}]} />
                    <RadarChart data = {[50, 80, 90, 70]} />

                    <BarChart data = {data} horizontal />

                    <LineChart data = {data} areaChart />

                    <PieChart data = {data} donut />
                </StackLayout>
            </ScrollView>
        </View>
    );
};

export default graphs;