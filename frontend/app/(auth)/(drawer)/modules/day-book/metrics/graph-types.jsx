import React from "react";
import { CartesianChart, Line, Bar } from "victory-native";
import { Pie, LinearGradient, vec, useFont } from "@shopify/react-native-skia";
import { Text } from "react-native";
import inter from "../../../../../../assets/styles/fonts/Inter_18pt-Regular.ttf";


// Registry of available graph types
// Each entry has: `label`, `value`, and a `render` function for later expansion
const GraphTypes = {
    line: {
        label: "Line Graph",
        value: "line",
        previewImage: require("../../../../../../assets/images/lineChart.png"),
        render: ({ data, xKey, yKeys }) => {
            const ChartComponent = () => {
                const font = useFont(inter, 12);
                if (!font) return null;

                return (
                    <CartesianChart
                        data={data}
                        xKey={xKey}
                        yKeys={yKeys}
                        axisOptions={{ font }}
                        domain={{ y: [0] }}
                    >
                        {({ points }) =>
                            yKeys.map((key, i) => (
                                <Line 
                                    key={i} 
                                    points={points[key]} 
                                    strokeWidth={3} />
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
        render: ({ data, xKey, yKeys }) => {
            const ChartComponent = () => {
                const font = useFont(inter, 12);
                if (!font) return null;

                return (
                    <CartesianChart 
                        data={data} 
                        xKey={xKey} 
                        yKeys={yKeys}
                        domain = {{y:[0]}}
                        axisOptions={{ font }}
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
        render: ({ data, yKeys }) => {
            <Pie
                data={data}
                valueKey={yKeys[0]} // only one metric for pie
                innerRadius={20}
                outerRadius={100}
            />
        },
    },
};

export default GraphTypes;

/*

*/