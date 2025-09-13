import React from "react";
import { CartesianChart, Line, Bar, VictoryPie } from "victory-native";
import { LinearGradient, vec, useFont } from "@shopify/react-native-skia";
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
            console.log("data:", data);
            const ChartComponent = () => {
                const font = useFont(inter, 12);
                if (!font) return null;

                return (
                    <CartesianChart
                        data={data}
                        xKey={xKey}
                        yKeys={yKeys}
                        axisOptions={{ 
                            font,
                            labelColor: "white",
                            tickColor: "white",
                            axisColor: "white",
                        }}
                        domain={{ y: [0] }}
                    >
                        {({ points }) =>
                            yKeys.map((key, i) => (
                                <Line 
                                    key={i} 
                                    points= {points[key]}
                                    strokeWidth={3}
                                    color={colours[i] || "black" }
                                />
                                
                            ))
                        }
                    </CartesianChart>
                );
                    
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
                const font = useFont(inter, 12);
                if (!font) return null;

                return (
                    <CartesianChart 
                        data={data} 
                        xKey={xKey} 
                        yKeys={yKeys}
                        domain = {{y:[0]}}
                        axisOptions={{ 
                            font,
                            labelColor: "white",
                            tickColor: "white",
                            axisColor: "white",
                        }}
                        domainPadding={{ left: 50, right: 50, top: 30 }}
                    >
                        {({ points, chartBounds }) =>
                            yKeys.map((key, i) => (
                                <Bar
                                    key={key}
                                    chartBounds={chartBounds}
                                    points={points[key]}
                                    roundedCorners={{ topLeft: 5, topRight: 5 }}
                                    barWidth={12}
                                    color={colours[i] || "black" }
                                />
                            ))
                        }
                    </CartesianChart>
                );
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