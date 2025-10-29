import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Button, TextInput, Text, useTheme } from 'react-native-paper';



const NAVIGATION_DESTINATIONS = [
    {
        id: 'home',
        label: 'Home',
        icon: 'home',
        route: '/(auth)/(tabs)/home'
    },
    {
        id: 'day-book',
        label: 'Day Book',
        icon: 'book-open-variant',
        route: '/(auth)/(drawer)/modules/day-book'
    },
    {
        id: 'metrics',
        label: 'Metrics',
        icon: 'chart-line',
        route: '/(auth)/(drawer)/modules/day-book/metrics'
    },
    {
        id: 'boards',
        label: 'Boards',
        icon: 'grid-large',
        route: '/(auth)/(drawer)/boards'
    },
    {
        id: 'leave',
        label: 'Leave Management',
        icon: 'calendar-clock',
        route: '/(auth)/(drawer)/modules/leave'
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: 'cog',
        route: '/(auth)/(tabs)/settings'
    },
    {
        id: 'profile',
        label: 'Profile',
        icon: 'account',
        route: '/(auth)/(tabs)/profile'
    }
];

const ButtonPicker = ({ onSelect, onCancel }) => {
    const theme = useTheme();
    const [buttonLabel, setButtonLabel] = useState('');
    const [selectedDestination, setSelectedDestination] = useState(null);
    const defaultButtonColor = theme.colors?.primary ?? '#2979FF';
    const [buttonColor, setButtonColor] = useState(defaultButtonColor);
    const [labelError, setLabelError] = useState(false);

    const handleDestinationSelect = (destination) => {
        setSelectedDestination(destination);
        if (!buttonLabel.trim()) {
            setButtonLabel(destination.label);
        }
    };

    const handleConfirm = () => {
        const trimmedLabel = buttonLabel.trim();
        
        if (!trimmedLabel) {
            setLabelError(true);
            return;
        }

        if (!selectedDestination) {
            return;
        }

        const buttonConfig = {
            label: trimmedLabel,
            destination: selectedDestination,
            color: buttonColor
        };

        onSelect(buttonConfig);
    };

    const isValid = buttonLabel.trim() && selectedDestination;

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <TextInput
                    label="Button Label"
                    value={buttonLabel}
                    onChangeText={(text) => {
                        setButtonLabel(text);
                        if (text.trim()) setLabelError(false);
                    }}
                    style={styles.input}
                    mode="outlined"
                    error={labelError}
                    placeholder="e.g., Go to Metrics"
                    dense
                />
                {labelError && (
                    <Text
                        variant="bodySmall"
                        style={[styles.errorText, { color: theme.colors?.error ?? '#ff5252' }]}
                    >
                        Button label is required
                    </Text>
                )}
            </View>

            <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                    Select Destination
                </Text>

                <View style={styles.destinationsGrid}>
                    {NAVIGATION_DESTINATIONS.map((destination) => (
                        <TouchableOpacity
                            key={destination.id}
                            onPress={() => handleDestinationSelect(destination)}
                            style={[
                                styles.destinationCard,
                                {
                                    borderColor: theme.colors?.outline ?? 'rgba(0,0,0,0.12)',
                                    backgroundColor: theme.colors?.surface ?? '#ffffff'
                                },
                                selectedDestination?.id === destination.id && {
                                    borderColor: theme.colors?.primary ?? defaultButtonColor,
                                    backgroundColor: theme.colors?.focusedBackground
                                        ?? theme.colors?.lowOpacityButton
                                        ?? theme.colors?.buttonBackground
                                        ?? '#E3F2FD',
                                    borderWidth: 2
                                }
                            ]}
                        >
                            <List.Icon icon={destination.icon} />
                            <Text variant="bodySmall" style={styles.destinationLabel} numberOfLines={1}>
                                {destination.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.actions}>
                <Button
                    mode="text"
                    onPress={onCancel}
                    style={styles.actionButton}
                >
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    onPress={handleConfirm}
                    disabled={!isValid}
                    style={styles.actionButton}
                >
                    Add Button
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    section: {
        marginBottom: 16
    },
    sectionTitle: {
        marginBottom: 12,
        fontWeight: '600'
    },
    input: {
        marginBottom: 8
    },
    errorText: {
        marginTop: -4,
        marginBottom: 8
    },
    destinationsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4
    },
    destinationCard: {
        width: '31%',
        aspectRatio: 1,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8
    },
    destinationLabel: {
        marginTop: 4,
        textAlign: 'center'
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 8,
        gap: 8
    },
    actionButton: {
        marginLeft: 8
    }
});

export default ButtonPicker;
