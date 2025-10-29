import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, IconButton, Menu, ActivityIndicator, FAB, List, Divider, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import Header from '../../../../../components/layout/Header';
import { GridLayout } from '../../../../../components/layout/Grid';
import CustomBottomSheet from '../../../../../components/BottomSheet';
import MetricPicker from '../../../../../components/boards/MetricPicker';
import ButtonPicker from '../../../../../components/boards/ButtonPicker';
import ResponsiveScreen from '../../../../../components/layout/ResponsiveScreen';
import { useBoardData } from '../../../../../hooks/useBoardData';
import { useMetricStates } from '../../../../../hooks/useMetricStates';
import { useDisplaySettings } from '../../../../../hooks/useDisplaySettings';
import MetricCard from '../../../../../components/boards/MetricCard';
import ButtonCard from '../../../../../components/boards/ButtonCard';
import TextCard from '../../../../../components/boards/TextCard';
import AddItemPicker from '../../../../../components/boards/AddItemPicker';
import MetricDetailHeader from '../../../../../components/boards/MetricDetailHeader';
import MetricDetailContent from '../../../../../components/boards/MetricDetailContent';
import DisplaySettingsSheet from '../../../../../components/boards/DisplaySettingsSheet';
import TextItemEditor from '../../../../../components/boards/TextItemEditor';
import { createMetricItem, createButtonItem, createTextItem, mapItemsToLayout, calculateButtonGridWidth, calculateMetricGridWidth, calculateTextGridWidth, calculateTextGridHeight } from '../../../../../utils/boards/itemHandlers';
import { sanitizeColourValue } from '../../../../../utils/boards/boardUtils';

const GRID_COLS = 12;
const METRIC_MIN_WIDTH = calculateMetricGridWidth(GRID_COLS);
const DEFAULT_METRIC_MAX_HEIGHT = 8;
const DEFAULT_BUTTON_MAX_HEIGHT = 3;

const BoardView = () => {
    const { id } = useLocalSearchParams();
    const theme = useTheme();

    const { 
        board, 
        loading, 
        isEditing, 
        setIsEditing, 
        updateLayout, 
        addItem, 
        removeItem, 
        updateItem 
    } = useBoardData(id);
    
    const { metricStates, ensureMetricState } = useMetricStates(board?.items);
    const {
        displayConfigItem,
        displayConfigDraft,
        displayColourLabels,
        openDisplaySettings: openDisplaySettingsHook,
        closeDisplaySettings: closeDisplaySettingsHook,
        updateDraft,
        resetColours,
        resetAppearance
    } = useDisplaySettings(board);
    
    const [menuVisible, setMenuVisible] = useState(false);
    const [showMetricPicker, setShowMetricPicker] = useState(false);
    const [showButtonPicker, setShowButtonPicker] = useState(false);
    const [showAddItemPicker, setShowAddItemPicker] = useState(false);
    const [activeMetricItemId, setActiveMetricItemId] = useState(null);
    const [showMetricDetails, setShowMetricDetails] = useState(false);
    const [showDisplaySettings, setShowDisplaySettings] = useState(false);
    const [showEditOptions, setShowEditOptions] = useState(false);
    const [editOptionsItem, setEditOptionsItem] = useState(null);
    const [activeResizeItemId, setActiveResizeItemId] = useState(null);
    const [showTextEditor, setShowTextEditor] = useState(false);
    const [textEditorMode, setTextEditorMode] = useState('create');
    const [textEditorInitialConfig, setTextEditorInitialConfig] = useState({});
    const [textEditorTargetId, setTextEditorTargetId] = useState(null);
    
    const isResizeActive = activeResizeItemId !== null;

    const activeMetricItem = useMemo(() => {
        if (!board?.items || !activeMetricItemId) return null;
        return board.items.find(item => item.id === activeMetricItemId) || null;
    }, [board?.items, activeMetricItemId]);

    const activeMetricState = activeMetricItem ? metricStates[activeMetricItem.id] : null;

    useEffect(() => {
        if (!isEditing) {
            setShowEditOptions(false);
            setEditOptionsItem(null);
            setShowTextEditor(false);
            setTextEditorTargetId(null);
        }
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing && activeResizeItemId !== null) {
            setActiveResizeItemId(null);
        }
    }, [isEditing, activeResizeItemId]);

    useEffect(() => {
        if (!activeResizeItemId) return;
        const hasItem = board?.items?.some(item => item.id === activeResizeItemId);
        if (!hasItem) {
            setActiveResizeItemId(null);
        }
    }, [activeResizeItemId, board?.items]);

    const handleMetricSelected = useCallback(async (metric) => {
        if (!board) return;

        const existingLayout = mapItemsToLayout(board.items, GRID_COLS);
        const newItem = createMetricItem(metric, existingLayout, GRID_COLS);

        await addItem(newItem);
        setShowMetricPicker(false);
    }, [board, addItem]);

    const handleButtonSelected = useCallback(async (destination) => {
        if (!board) return;

        const existingLayout = mapItemsToLayout(board.items, GRID_COLS);
        const newItem = createButtonItem(destination, existingLayout, GRID_COLS);

        await addItem(newItem);
        setShowButtonPicker(false);
    }, [board, addItem]);

    const normalizeTextConfig = useCallback((config) => {
        return createTextItem(config, [], GRID_COLS).config;
    }, [createTextItem]);

    const handleCreateTextItem = useCallback(async (config) => {
        if (!board) return;

        const existingLayout = mapItemsToLayout(board.items, GRID_COLS);
        const newItem = createTextItem(config, existingLayout, GRID_COLS);

        await addItem(newItem);
    }, [board, addItem, mapItemsToLayout, createTextItem]);

    const handleUpdateTextItem = useCallback(async (itemId, config) => {
        if (!board || !itemId) return;

        const existingItem = board.items?.find(item => item.id === itemId);
        const normalizedConfig = normalizeTextConfig(config);

        await updateItem(itemId, {
            config: {
                ...(existingItem?.config ?? {}),
                ...normalizedConfig
            }
        });
    }, [board, normalizeTextConfig, updateItem]);

    const handleTextEditorSave = useCallback(async (config) => {
        if (textEditorMode === 'create') {
            await handleCreateTextItem(config);
        } else if (textEditorMode === 'edit' && textEditorTargetId) {
            await handleUpdateTextItem(textEditorTargetId, config);
        }

        setShowTextEditor(false);
        setTextEditorTargetId(null);
        setTextEditorInitialConfig({});
    }, [handleCreateTextItem, handleUpdateTextItem, textEditorMode, textEditorTargetId]);

    const handleRemoveItem = useCallback((itemId) => {
        Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item from the board?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: () => removeItem(itemId)
                }
            ]
        );
    }, [removeItem]);

    const handleOpenMetricDetails = useCallback((itemId) => {
        if (isEditing) return;
        
        setActiveMetricItemId(itemId);
        setShowMetricDetails(true);

        const item = board?.items?.find(boardItem => boardItem.id === itemId);
        if (item) {
            ensureMetricState(item, { forceRefresh: true });
        }
    }, [isEditing, board?.items, ensureMetricState]);

    const handleCloseMetricDetails = useCallback(() => {
        setShowMetricDetails(false);
        setActiveMetricItemId(null);
    }, []);

    const handleEditMetric = useCallback((metricId) => {
        if (!metricId) return;
        handleCloseMetricDetails();
        router.navigate(`/modules/day-book/metrics/edit-metric/${metricId}`);
    }, [handleCloseMetricDetails]);

    const handleOpenDisplaySettings = useCallback((item) => {
        if (!item) return;
        handleCloseMetricDetails();
        openDisplaySettingsHook(item);
        setShowDisplaySettings(true);
    }, [handleCloseMetricDetails, openDisplaySettingsHook]);

    const handleCloseDisplaySettings = useCallback(() => {
        setShowDisplaySettings(false);
        closeDisplaySettingsHook();
    }, [closeDisplaySettingsHook]);

    const handleSaveDisplaySettings = useCallback(async () => {
        if (!displayConfigItem) return;

        const colourTokens = Array.isArray(displayConfigDraft.colours)
            ? displayConfigDraft.colours.map(colour => sanitizeColourValue(colour)).filter(Boolean)
            : [];

        const appearancePayload = {};
        if (displayConfigDraft.background?.trim()) 
            appearancePayload.background = displayConfigDraft.background.trim();
        if (displayConfigDraft.axisColor?.trim()) 
            appearancePayload.axisColor = displayConfigDraft.axisColor.trim();
        if (displayConfigDraft.tickLabelColor?.trim()) 
            appearancePayload.tickLabelColor = displayConfigDraft.tickLabelColor.trim();
        if (displayConfigDraft.gridColor?.trim()) 
            appearancePayload.gridColor = displayConfigDraft.gridColor.trim();
        if (displayConfigDraft.showGrid === false) 
            appearancePayload.showGrid = false;

        const updatedConfig = {
            ...displayConfigItem.config,
            label: displayConfigDraft.label?.trim() || displayConfigItem.config?.name || 'Metric'
        };

        if (colourTokens.length > 0) {
            updatedConfig.colours = colourTokens;
            updatedConfig.colors = colourTokens;
        }

        if (Object.keys(appearancePayload).length > 0) {
            updatedConfig.appearance = appearancePayload;
        }

        await updateItem(displayConfigItem.id, { config: updatedConfig });
        handleCloseDisplaySettings();
    }, [displayConfigItem, displayConfigDraft, updateItem, handleCloseDisplaySettings]);

    const handleRemoveMetricFromBoard = useCallback((itemId) => {
        handleCloseMetricDetails();
        handleRemoveItem(itemId);
    }, [handleCloseMetricDetails, handleRemoveItem]);

    const handleOpenItemOptions = useCallback((item) => {
        if (!item || isResizeActive) return;
        setEditOptionsItem(item);
        setShowEditOptions(true);
    }, [isResizeActive]);

    const handleCloseItemOptions = useCallback(() => {
        setShowEditOptions(false);
        setEditOptionsItem(null);
    }, []);

    const handleDisplaySettingsFromOptions = useCallback((item) => {
        if (!item) return;
        handleCloseItemOptions();
        handleOpenDisplaySettings(item);
    }, [handleCloseItemOptions, handleOpenDisplaySettings]);

    const handleDeleteItemFromOptions = useCallback((item) => {
        if (!item) return;
        handleCloseItemOptions();
        handleRemoveItem(item.id);
    }, [handleCloseItemOptions, handleRemoveItem]);

    const handleEditMetricFromOptions = useCallback((item) => {
        const metricId = item?.config?.metricId;
        handleCloseItemOptions();
        if (!metricId) return;
        handleEditMetric(metricId);
    }, [handleCloseItemOptions, handleEditMetric]);

    const handleEditTextFromOptions = useCallback((item) => {
        if (!item) return;
        handleCloseItemOptions();
        setTextEditorMode('edit');
        setTextEditorInitialConfig(item.config || {});
        setTextEditorTargetId(item.id);
        setShowTextEditor(true);
    }, [handleCloseItemOptions]);

    const handleItemLongPress = useCallback((itemId) => {
        if (!isEditing) return;
        setActiveResizeItemId(prev => {
            const nextId = prev === itemId ? null : itemId;
            if (nextId !== prev) {
                setShowEditOptions(false);
                setEditOptionsItem(null);
                setShowAddItemPicker(false);
                setShowMetricPicker(false);
                setShowButtonPicker(false);
            }
            return nextId;
        });
    }, [isEditing]);

    const handleResizeSessionEnd = useCallback((itemId) => {
        setActiveResizeItemId(prev => (prev === itemId ? null : prev));
    }, []);

    const handleExitResizeMode = useCallback(() => {
        setActiveResizeItemId(null);
        setShowEditOptions(false);
        setEditOptionsItem(null);
    }, []);

    const getGridItems = useCallback(() => {
        if (!board?.items) return [];

        return board.items.map(item => {
            const baseWidth = typeof item.w === 'number' ? item.w : 1;
            const baseHeight = typeof item.h === 'number' ? item.h : 1;
            const config = item.config || {};

            let xPosition = typeof item.x === 'number' ? item.x : 0;

            const configMinWidth = Math.max(1, config.minWidthUnits ?? 1);
            const configMinHeight = Math.max(1, config.minHeightUnits ?? 1);

            let minWidthUnits = configMinWidth;
            let maxHeightFallback = config.maxHeightUnits ?? (configMinHeight + 4);

            if (item.type === 'metric') {
                minWidthUnits = Math.max(minWidthUnits, METRIC_MIN_WIDTH);
                maxHeightFallback = Math.max(configMinHeight, config.maxHeightUnits ?? DEFAULT_METRIC_MAX_HEIGHT);
            } else if (item.type === 'button') {
                const labelWidthUnits = calculateButtonGridWidth(item.config?.label || 'Button', GRID_COLS);
                minWidthUnits = Math.max(minWidthUnits, labelWidthUnits);
                maxHeightFallback = Math.max(configMinHeight, config.maxHeightUnits ?? DEFAULT_BUTTON_MAX_HEIGHT);
            } else if (item.type === 'text') {
                const textContent = item.config?.text || '';
                const estimatedWidth = calculateTextGridWidth(textContent, GRID_COLS);
                const estimatedHeight = calculateTextGridHeight(textContent);
                minWidthUnits = Math.max(minWidthUnits, estimatedWidth);
                maxHeightFallback = Math.max(configMinHeight, config.maxHeightUnits ?? estimatedHeight);
            }

            let widthUnits = Math.max(baseWidth, minWidthUnits);
            widthUnits = Math.min(widthUnits, GRID_COLS);

            if (xPosition + widthUnits > GRID_COLS) {
                xPosition = Math.max(0, GRID_COLS - widthUnits);
            }

            const availableWidth = Math.max(1, GRID_COLS - xPosition);
            const configuredMaxWidth = config.maxWidthUnits ?? availableWidth;
            const maxWidthUnits = Math.max(widthUnits, Math.min(configuredMaxWidth, availableWidth));

            let heightUnits = Math.max(baseHeight, configMinHeight);
            const configuredMaxHeight = Math.max(configMinHeight, config.maxHeightUnits ?? maxHeightFallback);
            heightUnits = Math.min(heightUnits, configuredMaxHeight);

            const resizeConstraints = {
                minWidth: Math.max(1, minWidthUnits),
                minHeight: Math.max(1, configMinHeight),
                maxWidth: maxWidthUnits,
                maxHeight: configuredMaxHeight
            };

            const isMetricTouchable = !isEditing && item.type === 'metric';
            const WrapperComponent = isMetricTouchable ? TouchableOpacity : View;

            const wrapperProps = isMetricTouchable
                ? {
                    style: styles.itemContent,
                    activeOpacity: 0.7,
                    onPress: () => handleOpenMetricDetails(item.id)
                }
                : {
                    style: styles.itemContent
                };

            return {
                id: item.id,
                x: xPosition,
                y: typeof item.y === 'number' ? item.y : 0,
                w: widthUnits,
                h: heightUnits,
                resizeConstraints,
                content: (
                    <WrapperComponent {...wrapperProps}>
                        {item.type === 'metric' ? (
                            <MetricCard
                                item={item}
                                metricState={metricStates[item.id]}
                                isEditing={isEditing}
                                styles={styles}
                                onEdit={handleOpenItemOptions}
                                onPress={handleOpenMetricDetails}
                                disableEditActions={isResizeActive}
                            />
                        ) : item.type === 'button' ? (
                            <ButtonCard
                                item={item}
                                isEditing={isEditing}
                                onEdit={handleOpenItemOptions}
                                disableEditActions={isResizeActive}
                            />
                        ) : item.type === 'text' ? (
                            <TextCard
                                item={item}
                                isEditing={isEditing}
                                onEdit={handleOpenItemOptions}
                                disableEditActions={isResizeActive}
                            />
                        ) : null}
                    </WrapperComponent>
                )
            };
        });
    }, [board?.items, isEditing, metricStates, handleOpenMetricDetails, handleOpenItemOptions, isResizeActive]);

    if (loading) {
        return (
            <ResponsiveScreen
                header={<Header title="Board" showBack />}
                center={true}
            >
                <ActivityIndicator size="large" />
            </ResponsiveScreen>
        );
    }

    if (!board) {
        return (
            <ResponsiveScreen
                header={<Header title="Board" showBack />}
                center={true}
            >
                <Text>Board not found</Text>
            </ResponsiveScreen>
        );
    }

    return (
        <>
            <ResponsiveScreen
                header={
                    <Header
                        title={board.name}
                        subtitle={board.description}
                        showBack
                        rightActions={[
                            {
                                icon: isEditing ? 'check' : 'pencil',
                                onPress: () => setIsEditing(!isEditing)
                            },
                            {
                                icon: 'dots-vertical',
                                onPress: () => setMenuVisible(true)
                            }
                        ]}
                    />
                }
                scroll={false}
                padded={false}
            >
                <View style={styles.container}>
                    {board.items?.length === 0 ? (
                        <View style={styles.emptyState}>
                            <IconButton icon="view-grid-plus" size={64} />
                            <Text variant="titleLarge" style={styles.emptyTitle}>
                                No items yet
                            </Text>
                            <Text variant="bodyMedium" style={styles.emptyDescription}>
                                Add metrics, buttons, or text to get started
                            </Text>
                        </View>
                    ) : (
                        <GridLayout
                            items={getGridItems()}
                            cols={GRID_COLS}
                            rowHeight={100}
                            margin={[10, 10]}
                            isDraggable={isEditing}
                            isResizable={Boolean(activeResizeItemId)}
                            activeResizeItemId={activeResizeItemId}
                            onItemLongPress={isEditing ? handleItemLongPress : undefined}
                            onBackgroundPress={handleExitResizeMode}
                            onResizeSessionEnd={handleResizeSessionEnd}
                            onLayoutChange={updateLayout}
                            containerStyle={styles.gridContainer}
                        />
                    )}

                    {isEditing && !isResizeActive && (
                        <FAB
                            icon="plus"
                            style={styles.fab}
                            onPress={() => setShowAddItemPicker(true)}
                        />
                    )}
                </View>

                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={{ x: 0, y: 0 }}
                >
                    <Menu.Item
                        leadingIcon="cog"
                        title="Settings"
                        onPress={() => {
                            setMenuVisible(false);
                            router.navigate(`/boards/${id}/settings`);
                        }}
                    />
                </Menu>
            </ResponsiveScreen>

            {showEditOptions && editOptionsItem && (
                <CustomBottomSheet
                    variant="standard"
                    footer={{ variant: 'none' }}
                    containerStyle={{ zIndex: 9999 }}
                    header={{
                        title: editOptionsItem.type === 'metric'
                            ? 'Edit Metric'
                            : editOptionsItem.type === 'text'
                                ? 'Edit Text'
                                : 'Edit Button',
                        showClose: true
                    }}
                    onChange={(index) => {
                        if (index === -1) handleCloseItemOptions();
                    }}
                    onClose={handleCloseItemOptions}
                >
                    <View style={styles.editOptionsContainer}>
                        <Text style={styles.editOptionsItemLabel} numberOfLines={1}>
                            {editOptionsItem.config?.label
                                || editOptionsItem.config?.name
                                || (editOptionsItem.type === 'text' ? editOptionsItem.config?.text : null)
                                || 'Board Item'}
                        </Text>
                        <Divider style={styles.editOptionsDivider} />

                        {editOptionsItem.type === 'metric' && (
                            <View style={styles.editOptionsSection}>
                                <List.Item
                                    title="Edit Metric"
                                    description="Modify the underlying metric configuration"
                                    left={(props) => <List.Icon {...props} icon="pencil" />}
                                    disabled={!editOptionsItem?.config?.metricId}
                                    onPress={() => handleEditMetricFromOptions(editOptionsItem)}
                                />
                                <List.Item
                                    title="Display Settings"
                                    description="Adjust how this metric appears on the board"
                                    left={(props) => <List.Icon {...props} icon="palette" />}
                                    onPress={() => handleDisplaySettingsFromOptions(editOptionsItem)}
                                />
                                <Divider style={styles.editOptionsDivider} />
                            </View>
                        )}

                        {editOptionsItem.type === 'text' && (
                            <View style={styles.editOptionsSection}>
                                <List.Item
                                    title="Edit Text"
                                    description="Update the text content and styling"
                                    left={(props) => <List.Icon {...props} icon="pencil" />}
                                    onPress={() => handleEditTextFromOptions(editOptionsItem)}
                                />
                                <Divider style={styles.editOptionsDivider} />
                            </View>
                        )}

                        <List.Item
                            title="Remove from Board"
                            description="Delete this item from the current board"
                            left={(props) => <List.Icon {...props} icon="trash-can-outline" color={theme.colors.error} />}
                            titleStyle={[styles.editOptionDeleteText, { color: theme.colors.error }]}
                            onPress={() => handleDeleteItemFromOptions(editOptionsItem)}
                        />
                    </View>
                </CustomBottomSheet>
            )}

            {showMetricDetails && activeMetricItem && (
                <CustomBottomSheet
                    variant="standard"
                    footer={{ variant: 'none' }}
                    containerStyle={{ zIndex: 9999 }}
                    header={{
                        showClose: false,
                        component: (
                            <MetricDetailHeader
                                item={activeMetricItem}
                                onEdit={handleEditMetric}
                                onDelete={handleRemoveMetricFromBoard}
                                onClose={handleCloseMetricDetails}
                                styles={styles}
                            />
                        )
                    }}
                    onChange={(index) => {
                        if (index === -1) handleCloseMetricDetails();
                    }}
                    onClose={handleCloseMetricDetails}
                >
                    <MetricDetailContent
                        item={activeMetricItem}
                        metricState={activeMetricState}
                        styles={styles}
                    />
                </CustomBottomSheet>
            )}

            <DisplaySettingsSheet
                visible={showDisplaySettings}
                item={displayConfigItem}
                draft={displayConfigDraft}
                colourLabels={displayColourLabels}
                onClose={handleCloseDisplaySettings}
                onSave={handleSaveDisplaySettings}
                onUpdateDraft={updateDraft}
                onResetColours={resetColours}
                onResetAppearance={resetAppearance}
            />

            {showMetricPicker && (
                <CustomBottomSheet
                    variant="standard"
                    footer={{ variant: 'none' }}
                    containerStyle={{ zIndex: 9999 }}
                    header={{
                        title: 'Select Metric',
                        showClose: true
                    }}
                    onChange={(index) => {
                        if (index === -1) setShowMetricPicker(false);
                    }}
                    onClose={() => setShowMetricPicker(false)}
                >
                    <MetricPicker
                        onSelect={handleMetricSelected}
                        onCancel={() => setShowMetricPicker(false)}
                        multiSelect={false}
                    />
                </CustomBottomSheet>
            )}

            {showButtonPicker && (
                <CustomBottomSheet
                    variant="standard"
                    footer={{ variant: 'none' }}
                    containerStyle={{ zIndex: 9999 }}
                    header={{
                        title: 'Add Button',
                        showClose: true
                    }}
                    onChange={(index) => {
                        if (index === -1) setShowButtonPicker(false);
                    }}
                    onClose={() => setShowButtonPicker(false)}
                >
                    <ButtonPicker
                        onSelect={handleButtonSelected}
                        onCancel={() => setShowButtonPicker(false)}
                    />
                </CustomBottomSheet>
            )}

            {showTextEditor && (
                <CustomBottomSheet
                    variant="standard"
                    footer={{ variant: 'none' }}
                    containerStyle={{ zIndex: 9999 }}
                    header={{
                        title: textEditorMode === 'edit' ? 'Edit Text' : 'Add Text',
                        showClose: true
                    }}
                    onChange={(index) => {
                        if (index === -1) {
                            setShowTextEditor(false);
                            setTextEditorTargetId(null);
                            setTextEditorInitialConfig({});
                        }
                    }}
                    onClose={() => {
                        setShowTextEditor(false);
                        setTextEditorTargetId(null);
                        setTextEditorInitialConfig({});
                    }}
                >
                    <TextItemEditor
                        initialConfig={textEditorInitialConfig}
                        mode={textEditorMode}
                        onSave={handleTextEditorSave}
                        onCancel={() => {
                            setShowTextEditor(false);
                            setTextEditorTargetId(null);
                            setTextEditorInitialConfig({});
                        }}
                    />
                </CustomBottomSheet>
            )}

            {showAddItemPicker && (
                <CustomBottomSheet
                    variant="standard"
                    footer={{ variant: 'none' }}
                    containerStyle={{ zIndex: 9999 }}
                    header={{
                        title: 'Add to Board',
                        showClose: true
                    }}
                    onChange={(index) => {
                        if (index === -1) setShowAddItemPicker(false);
                    }}
                    onClose={() => setShowAddItemPicker(false)}
                >
                    <AddItemPicker
                        onSelectMetric={() => {
                            setShowAddItemPicker(false);
                            setShowMetricPicker(true);
                        }}
                        onSelectButton={() => {
                            setShowAddItemPicker(false);
                            setShowButtonPicker(true);
                        }}
                        onSelectText={() => {
                            setShowAddItemPicker(false);
                            setTextEditorMode('create');
                            setTextEditorInitialConfig({
                                text: '',
                                alignment: 'left',
                                fontSize: 18,
                                padding: 16,
                                textColor: '',
                                backgroundColor: '',
                                maxLines: undefined
                            });
                            setTextEditorTargetId(null);
                            setShowTextEditor(true);
                        }}
                    />
                </CustomBottomSheet>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    gridContainer: {
        flex: 1,
        padding: 10
    },
    itemContent: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8
    },
    emptyDescription: {
        opacity: 0.7,
        textAlign: 'center'
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16
    },
    editOptionsContainer: {
        paddingTop: 4,
        paddingBottom: 12
    },
    editOptionsItemLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4
    },
    editOptionsDivider: {
        marginVertical: 4
    },
    editOptionsSection: {
        marginBottom: 4
    },
    editOptionDeleteText: {
        fontWeight: '600'
    },
    // Metric Card Styles
    metricCardTouchable: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    metricGraphCardWrapper: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    metricGraphCard: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#1a1d2e',
        position: 'relative'
    },
    metricGraphCardEditing: {
        opacity: 0.7
    },
    metricEditOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        zIndex: 10
    },
    removeButton: {
        margin: 0,
        borderRadius: 16
    },
    metricPreviewChart: {
        flex: 1,
        width: '100%',
        height: '100%'
    },
    metricPreviewChartInner: {
        flex: 1,
        padding: 8
    },
    metricPreviewPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },
    metricPreviewPlaceholderText: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.75,
        marginTop: 8
    },
    metricCompactStatusErrorText: {
        color: '#ff8a80'
    },
    // Button Card Styles - now handled in ButtonCard component itself
    // Metric Detail Header Styles
    metricDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)'
    },
    metricDetailHeaderText: {
        flex: 1,
        marginRight: 8
    },
    metricDetailHeaderTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2
    },
    metricDetailHeaderSubtitle: {
        fontSize: 13,
        opacity: 0.65
    },
    metricDetailHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    metricDetailHeaderIcon: {
        margin: 0,
        marginLeft: 4
    },
    // Metric Detail Content Styles
    metricDetailContainer: {
        flex: 1
    },
    metricDetailChart: {
        height: 280,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#1a1d2e'
    },
    metricDetailChartInner: {
        flex: 1,
        padding: 12
    },
    metricStatus: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    metricStatusText: {
        marginTop: 12,
        fontSize: 13,
        opacity: 0.75
    },
    metricErrorText: {
        fontSize: 13,
        textAlign: 'center'
    },
    metricEmptyText: {
        fontSize: 13,
        textAlign: 'center'
    },
    metricDetailInfo: {
        paddingHorizontal: 0
    },
    metricDetailMetaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16
    },
    metricDetailMetaItem: {
        width: '50%',
        marginBottom: 12
    },
    metricDetailMetaLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        opacity: 0.5,
        marginBottom: 4,
        fontWeight: '600'
    },
    metricDetailMetaValue: {
        fontSize: 14,
        fontWeight: '500'
    },
    metricDetailSummaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
    },
    metricDetailSummaryChip: {
        marginBottom: 0
    },
    metricDetailVariables: {
        marginTop: 8
    },
    metricDetailChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    metricDetailChip: {
        marginBottom: 0
    }
});

export default BoardView;
