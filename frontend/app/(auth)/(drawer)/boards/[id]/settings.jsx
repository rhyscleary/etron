import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, List, Divider } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import Header from '../../../../../components/layout/Header';
import BoardService from '../../../../../services/BoardService';
import ResponsiveScreen from '../../../../../components/layout/ResponsiveScreen';
import BasicButton from '../../../../../components/common/buttons/BasicButton';

const BoardSettings = () => {
    const { id } = useLocalSearchParams();
    const [board, setBoard] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBoard();
    }, [id]);

    const loadBoard = async () => {
        if (!id) return;
        const boardData = await BoardService.getBoard(id);
        if (boardData) {
            setBoard(boardData);
            setName(boardData.name);
            setDescription(boardData.description || '');
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Board name is required');
            return;
        }

        try {
            setSaving(true);
            const updated = await BoardService.updateBoard(board.id, {
                name: name.trim(),
                description: description.trim()
            });

            if (updated) {
                Alert.alert('Success', 'Settings saved', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Board',
            `Are you sure you want to delete "${board.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const success = await BoardService.deleteBoard(board.id);
                            if (success) {
                                Alert.alert('Success', 'Board deleted', [
                                    { text: 'OK', onPress: () => router.replace('/boards') }
                                ]);
                            }
                        } catch (error) {
                            console.error('Error deleting board:', error);
                            Alert.alert('Error', 'Failed to delete board');
                        }
                    }
                }
            ]
        );
    };

    const handleDuplicate = async () => {
        try {
            const duplicated = await BoardService.duplicateBoard(board.id);
            if (duplicated) {
                Alert.alert('Success', 'Board duplicated', [
                    {
                        text: 'View Copy',
                        onPress: () => router.replace(`/boards/${duplicated.id}`)
                    },
                    { text: 'Stay Here' }
                ]);
            }
        } catch (error) {
            console.error('Error duplicating board:', error);
            Alert.alert('Error', 'Failed to duplicate board');
        }
    };

    if (!board) {
        return (
            <ResponsiveScreen
                scroll={false}
                padded={false}
                center={false}
                tapToDismissKeyboard={false}
                header={<Header title="Settings" showBack />}
            >
                <View style={styles.loadingContainer}>
                    <Text>Loading...</Text>
                </View>
            </ResponsiveScreen>
        );
    }

    return (
        <ResponsiveScreen
            scroll={false}
            padded={false}
            center={false}
            tapToDismissKeyboard={false}
            header={(
                <Header
                    title="Board Settings"
                    showBack
                    showCheck
                    onRightIconPress={handleSave}
                />
            )}
        >
            <ScrollView style={styles.container}>
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Basic Information
                    </Text>
                    
                    <TextInput
                        mode="outlined"
                        label="Board Name"
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                    />

                    <TextInput
                        mode="outlined"
                        label="Description"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Board Information
                    </Text>
                    <List.Item
                        title="Created"
                        description={new Date(board.metadata?.createdAt).toLocaleString()}
                        left={() => <List.Icon icon="calendar-plus" />}
                    />
                    <List.Item
                        title="Last Updated"
                        description={new Date(board.metadata?.updatedAt).toLocaleString()}
                        left={() => <List.Icon icon="calendar-edit" />}
                    />
                    <List.Item
                        title="Items"
                        description={`${board.items?.length || 0} items`}
                        left={() => <List.Icon icon="grid" />}
                    />
                    <List.Item
                        title="Version"
                        description={`v${board.metadata?.version || 1}`}
                        left={() => <List.Icon icon="tag" />}
                    />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Actions
                    </Text>
                    <BasicButton
                        label="Duplicate Board"
                        mode="outlined"
                        icon="content-copy"
                        fullWidth
                        onPress={handleDuplicate}
                        style={styles.actionButton}
                    />
                    <BasicButton
                        label="Delete Board"
                        mode="outlined"
                        icon="delete"
                        danger
                        fullWidth
                        onPress={handleDelete}
                        style={styles.actionButton}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <BasicButton
                        label="Cancel"
                        mode="outlined"
                        fullWidth
                        onPress={() => router.back()}
                        disabled={saving}
                        style={styles.cancelButton}
                    />
                    <BasicButton
                        label="Save Changes"
                        fullWidth
                        onPress={handleSave}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                    />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        marginBottom: 16
    },
    input: {
        marginBottom: 16
    },
    divider: {
        marginVertical: 24
    },
    actionButton: {
        marginBottom: 12
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
    saveButton: {
        flex: 1
    }
});

export default BoardSettings;
