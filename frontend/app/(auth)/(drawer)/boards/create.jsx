import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { router } from 'expo-router';
import Header from '../../../../components/layout/Header';
import BoardService from '../../../../services/BoardService';
import ResponsiveScreen from '../../../../components/layout/ResponsiveScreen';

const CreateBoard = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const hasCompletedCreationRef = useRef(false);
    const hasDraftChangesRef = useRef(false);

    useEffect(() => {
        return () => {
            if (!hasCompletedCreationRef.current && hasDraftChangesRef.current) {
                Alert.alert('Draft Saved', 'Any details you entered will be saved as a draft.');
            }
        };
    }, []);

    const handleNameChange = (value) => {
        hasDraftChangesRef.current = true;
        setName(value);
    };

    const handleDescriptionChange = (value) => {
        hasDraftChangesRef.current = true;
        setDescription(value);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Please enter a board name');
            return;
        }

        try {
            setCreating(true);
            const board = await BoardService.createBoard({
                name: name.trim(),
                description: description.trim()
            });

            if (board) {
                hasCompletedCreationRef.current = true;
                router.replace(`/boards/${board.id}`);
            } else {
                Alert.alert('Error', 'Failed to create board');
            }
        } catch (error) {
            console.error('Error creating board:', error);
            Alert.alert('Error', 'Failed to create board');
        } finally {
            setCreating(false);
        }
    };

    return (
        <ResponsiveScreen
            scroll={false}
            padded={false}
            center={false}
            tapToDismissKeyboard={false}
            header={(
                <Header
                    title="Create Board"
                    showBack
                    showCheck
                    onRightIconPress={handleCreate}
                />
            )}
        >
            <ScrollView style={styles.container}>
                <TextInput
                    mode="outlined"
                    label="Board Name"
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="e.g., Q4 Metrics Dashboard"
                    style={styles.input}
                />

                <TextInput
                    mode="outlined"
                    label="Description (Optional)"
                    value={description}
                    onChangeText={handleDescriptionChange}
                    placeholder="Describe what this board is for..."
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                />

                <View style={styles.buttonContainer}>
                    <Button
                        mode="outlined"
                        onPress={() => router.back()}
                        style={styles.cancelButton}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleCreate}
                        style={styles.createButton}
                        loading={creating}
                        disabled={creating || !name.trim()}
                    >
                        Create Board
                    </Button>
                </View>
            </ScrollView>
        </ResponsiveScreen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16
    },
    input: {
        marginBottom: 16
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 32
    },
    cancelButton: {
        flex: 1
    },
    createButton: {
        flex: 1
    }
});

export default CreateBoard;
