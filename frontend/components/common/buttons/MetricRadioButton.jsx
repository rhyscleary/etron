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

  return (
    <RadioButton.Group onValueChange={handleSelect} value={value}>
      <View style={styles.container}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <RadioButton value={item} />
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </RadioButton.Group>
  );
};

export default MetricRadioButton;

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