import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, RadioButton } from "react-native-paper";

const CustomRadioButton = ({ title, value, options }) => {
    const [checked, setChecked] = useState(null);

    return (
        <View style={StyleSheet.container}>
            <Text style={styles.title}>{title}</Text>
            
            <RadioButton.Group onValueChange={newValue => 
                setChecked(newValue)} 
                value={checked}
            >
                {Array.from({ length: value }, (_, i) => (
                    <View key={i} style={styles.optionRow}>
                        <RadioButton value={options[i]} />
                        <Text style={styles.optionLabel}>{options[i]}</Text>
                    </View>
                ))}
            </RadioButton.Group>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  optionLabel: {
    fontSize: 16,
  },
});

export default CustomRadioButton;