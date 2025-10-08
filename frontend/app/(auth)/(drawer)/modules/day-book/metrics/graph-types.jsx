import React from "react";
import { CartesianChart, Line, Bar, VictoryPie } from "victory-native";
import { Text } from "react-native";
import inter from "../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";


// Registry of available graph types
// Each entry has: `label`, `value`, and a `render` function for later expansion
const GraphTypes = {
    line: {
        label: "Line Chart",
        value: "line",
        previewImage: require("../../../../../../assets/images/lineChart.png"),
        render: ({ data, xKey, yKeys, colours }) => {
            const ChartComponent = () => {
            };
            return <ChartComponent/>;
        },
    },

    bar: {
        label: "Bar Chart",
        value: "bar",
        previewImage: require("../../../../../../assets/images/barChart.png"),
        render: ({ data, xKey, yKeys, colours }) => {
            const ChartComponent = () => {
            };
            return <ChartComponent/>
        },
    },

    pie: {
        label: "Pie Chart",
        value: "pie",
        previewImage: require("../../../../../../assets/images/pieChart.png"),
        render: ({ data, xKey, yKeys, colours }) => {
            if (!xKey || !yKeys?.[0]) return <Text>No variable selected</Text>;
            
            const pieData = data.map((row) => ({
                x: String(row[xKey]),   // independent variable used as label
                y: String(row[yKeys[0]]), // dependent variable determines slice size
            }));

            return (
                <VictoryPie
                    data={pieData}
                    innerRadius={50}
                    labelRadius={80}
                    colorScale={colours && colours.length > 0 ? colours : ["red", "blue", "green", "purple"]}                
                    style={{
                        labels: { fill: "white", fontSize: 14, fontWeight: "bold" },
                    }}
                />
            )
        },
    },
};

export default GraphTypes;

/*

*/