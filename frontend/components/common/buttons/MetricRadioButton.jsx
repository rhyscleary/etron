import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { RadioButton, Text } from "react-native-paper";

const MetricRadioButton = ({ items = [], selected = null, onChange }) => {
const [value, setValue] = useState(selected);

  useEffect(() => {
    setValue(selected);
  }, [selected]);

  const handleSelect = (item) => {
    setValue(item);
    onChange(item);
  };

  const leftColumn = items.filter((_, idx) => idx % 2 === 0);
  const rightColumn = items.filter((_, idx) => idx % 2 !== 0);

  return (
    <RadioButton.Group onValueChange={handleSelect} value={value}>
      <View style={styles.container}>
        {/* Left column */}
        <View style={styles.column}>
          {leftColumn.map((item, idx) => (
            <View key={`left-${idx}`} style={styles.row}>
              <RadioButton value={item} />
              <Text 
                numberOfLines={1} 
                ellipsizeMode="tail" 
                style={styles.label}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>

        {/* Right column */}
        <View style={styles.column}>
          {rightColumn.map((item, idx) => (
            <View key={`right-${idx}`} style={styles.row}>
              <RadioButton value={item} />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.label}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </RadioButton.Group>
  );
};

export default MetricRadioButton;

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
    maxWidth: "70%"
  },
});