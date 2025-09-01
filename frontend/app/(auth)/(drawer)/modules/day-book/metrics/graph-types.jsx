import React from "react";
import { CartesianChart, Line, Bar } from "victory-native";
import { Pie, LinearGradient, vec, useFont } from "@shopify/react-native-skia";
import { Text } from "react-native";

// Registry of available graph types
// Each entry has: `label`, `value`, and a `render` function for later expansion
const GraphTypes = {
    line: {
        label: "Line Chart",
        value: "line",
        render: ({ data, xKey, yKeys }) => (
            <CartesianChart 
                data={data} 
                xKey={xKey} 
                yKeys={yKeys}
            >
                {({ points }) =>
                    yKeys.map((key, i) => (
                        <Line
                            key={i}
                            points={points[key]}
                            strokeWidth={3}
                        />
                    ))
                }
            </CartesianChart>
        ),
    },

    bar: {
        label: "Bar Chart",
        value: "bar",
        render: ({ data, xKey, yKeys }) => (
            <CartesianChart 
                data={data} 
                xKey={xKey} 
                yKeys={yKeys}
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
        ),
    },

    pie: {
        label: "Pie Chart",
        value: "pie",
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