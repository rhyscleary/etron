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

    const leftColumn = items.filter((_, idx) => idx % 2 === 0);
    const rightColumn = items.filter((_, idx) => idx % 2 !== 0);

    return (
        <View style={styles.container}>
            {/* Left column */}
            <View style={styles.column}>
                {leftColumn.map((item, idx) => (
                    <View key={`left-${idx}`} style={styles.row}>
                        <Checkbox
                            status={checkedItems.includes(item) ? "checked" : "unchecked"}
                            onPress={() => toggleItem(item)}
                        />
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.label}>
                            {item}
                        </Text>
                    </View>
                ))}
            </View>
          
            {/* Right column */}
            <View style={styles.column}>
                {rightColumn.map((item, idx) => (
                    <View key={`right-${idx}`} style={styles.row}>
                        <Checkbox
                            status={checkedItems.includes(item) ? "checked" : "unchecked"}
                            onPress={() => toggleItem(item)}
                        />
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.label}>
                            {item}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default MetricCheckbox;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  column: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    flexShrink: 1,
    maxWidth: "70%",
  }
});