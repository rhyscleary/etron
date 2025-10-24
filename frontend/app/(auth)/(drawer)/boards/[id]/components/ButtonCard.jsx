import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { router } from 'expo-router';

const ButtonCard = ({ item, isEditing, styles, onRemove }) => {
    const config = item.config || {};
    const buttonLabel = config.label || 'Button';
    const buttonColor = config.color || '#2979FF';
    const destinationRoute = config.destination;

    const handleButtonPress = () => {
        if (!destinationRoute) return;
        router.push(destinationRoute);
    };

    return (
        <View style={styles.buttonContainer}>
            {isEditing && (
                <View style={styles.buttonEditOverlay}>
                    <IconButton
                        icon="close"
                        size={16}
                        onPress={() => onRemove(item.id)}
                        style={styles.removeButton}
                    />
                </View>
            )}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={isEditing ? undefined : handleButtonPress}
                disabled={isEditing}
                style={[
                    styles.buttonWrapper,
                    isEditing && styles.buttonWrapperEditing
                ]}
            >
                <Button
                    mode="contained"
                    buttonColor={buttonColor}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    style={styles.button}
                    disabled={isEditing}
                >
                    {buttonLabel}
                </Button>
            </TouchableOpacity>
        </View>
    );
};

export default ButtonCard;
