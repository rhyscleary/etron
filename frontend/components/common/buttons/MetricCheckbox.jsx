import React, { useState, useEffect } from "react";
import {View, StyleSheet } from "react-native";
import { Checkbox, Text } from "react-native-paper";

const MetricCheckbox = ({ 
    items = [], 
    selected = [], 
    onChange
}) => {
    
    const [checkedItems, setCheckedItems] = useState(selected);

    useEffect(() => {
        setCheckedItems(selected);
    }, [selected]);

    const toggleItem = (item) => {
        let newChecked;
        if (checkedItems.includes(item)) {
            newChecked = checkedItems.filter((i) => i !== item);
        } else {
            newChecked = [...checkedItems, item];
        }
        setCheckedItems(newChecked);
        onChange(newChecked);
    };

    return (
        <View style={StyleSheet.container}>
            {items.map((item, idx) => (
                <View key={idx} style={styles.row}>
                    <Checkbox
                        status={checkedItems.includes(item) ? "checked" : "unchecked"}
                        onPress={() => toggleItem(item)}
                    />
                    <Text>{item}</Text>
                </View>
            ))}
        </View>
    );
};

export default MetricCheckbox;

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
});