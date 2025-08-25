// Author(s): Matthew Page

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import DropDown from "../../../../../../components/common/input/DropDown";

const CreateReport = () => {
    const [elements, setElements] = useState([]);
    const [selectedType, setSelectedType] = useState(null);

    const elementType = [
        { label: "Text Box", value: "text" },
        { label: "Metric", value: "metric" },
        { label: "Data Table", value: "table" },
    ];

    const handleAddElement = () => {
        if (selectedType) {
            // Add new element with unique id
            const newElement = {
                id: Date.now().toString(), // simple unique id
                type: selectedType,
            };
            setElements([...elements, newElement]);
        }
    };

    const handleRemove = (id) => {
        setElements(elements.filter((el) => el.id !== id));
    };

    return (
        <View style={commonStyles.screen}>
            <Header title="Structure Report" showBack />

            {/* Render selected elements */}
            <View style={styles.selectedContainer}>
                {elements.map((el) => {
                    const label = elementType.find((e) => e.value === el.type)?.label || el.type;
                    return (
                        <View key={el.id} style={styles.elementBox}>
                            <Text style={styles.elementText}>{label}</Text>
                            <TouchableOpacity onPress={() => handleRemove(el.id)}>
                                <Text style={styles.removeText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>

            {/* Dropdown for choosing type */}
            <DropDown
                title="Select Report Element"
                items={elementType}
                showRouterButton={false}
                onSelect={(value) => setSelectedType(value)}
            />

            {/* Button to add */}
            <TouchableOpacity
                style={[
                    styles.addButton,
                    !selectedType && { backgroundColor: "#ccc" },
                ]}
                onPress={handleAddElement}
                disabled={!selectedType}
            >
                <Text style={styles.addButtonText}>Add Element</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    selectedContainer: {
        marginBottom: 16,
    },
    elementBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: "#f0f0f0",
        borderRadius: 6,
        marginBottom: 8,
    },
    elementText: {
        fontSize: 16,
    },
    removeText: {
        fontSize: 18,
        color: "red",
        marginLeft: 12,
    },
    addButton: {
        marginTop: 12,
        padding: 14,
        borderRadius: 6,
        alignItems: "center",
        backgroundColor: "#007AFF",
    },
    addButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default CreateReport;
