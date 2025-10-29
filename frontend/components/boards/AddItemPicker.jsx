import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';

const AddItemPicker = ({ onSelectMetric, onSelectButton, onSelectText }) => {
    return (
        <View style={styles.container}>
            <List.Item
                title="Metric"
                description="Add a data metric visualization"
                left={(props) => <List.Icon {...props} icon="chart-line" />}
                onPress={onSelectMetric}
                style={styles.item}
            />
            <List.Item
                title="Button"
                description="Add a navigation button"
                left={(props) => <List.Icon {...props} icon="gesture-tap-button" />}
                onPress={onSelectButton}
                style={styles.item}
            />
            <List.Item
                title="Text"
                description="Add a formatted text block"
                left={(props) => <List.Icon {...props} icon="format-text" />}
                onPress={onSelectText}
                style={styles.item}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8
    },
    item: {
        borderRadius: 8,
        marginHorizontal: 8,
        marginVertical: 4
    }
});

export default AddItemPicker;
