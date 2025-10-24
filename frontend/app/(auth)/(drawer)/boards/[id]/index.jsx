import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, IconButton, Menu, ActivityIndicator, FAB } from 'react-native-paper';
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
import MetricCard from './components/MetricCard';
import ButtonCard from './components/ButtonCard';
import AddItemPicker from './components/AddItemPicker';
import MetricDetailHeader from './components/MetricDetailHeader';
import MetricDetailContent from './components/MetricDetailContent';
import DisplaySettingsSheet from './components/DisplaySettingsSheet';
import { createMetricItem, createButtonItem, mapItemsToLayout } from './helpers/itemHandlers';
import { sanitizeColourValue } from './utils';

const BoardView = () => {
    const { id } = useLocalSearchParams();
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
    
    const activeMetricItem = useMemo(() => {
        if (!board?.items || !activeMetricItemId) return null;
        return board.items.find(item => item.id === activeMetricItemId) || null;
    }, [board?.items, activeMetricItemId]);

    const activeMetricState = activeMetricItem ? metricStates[activeMetricItem.id] : null;

    const handleMetricSelected = useCallback(async (metric) => {
        if (!board) return;
        
        const existingLayout = mapItemsToLayout(board.items);
        const newItem = createMetricItem(metric, existingLayout);
        
        await addItem(newItem);
        setShowMetricPicker(false);
    }, [board, addItem]);

    const handleButtonSelected = useCallback(async (destination) => {
        if (!board) return;
        
        const existingLayout = mapItemsToLayout(board.items);
        const newItem = createButtonItem(destination, existingLayout);
        
        await addItem(newItem);
        setShowButtonPicker(false);
    }, [board, addItem]);

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

    const getGridItems = useCallback(() => {
        if (!board?.items) return [];

        return board.items.map(item => ({
            id: item.id,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            content: (
                <TouchableOpacity
                    style={styles.itemContent}
                    activeOpacity={isEditing ? 1 : 0.7}
                    onPress={() => {
                        if (isEditing) return;
                        if (item.type === 'metric') {
                            handleOpenMetricDetails(item.id);
                        }
                    }}
                >
                    {item.type === 'metric' ? (
                        <MetricCard
                            item={item}
                            metricState={metricStates[item.id]}
                            isEditing={isEditing}
                            styles={styles}
                            onRemove={() => handleRemoveItem(item.id)}
                            onPress={() => handleOpenMetricDetails(item.id)}
                        />
                    ) : item.type === 'button' ? (
                        <ButtonCard
                            item={item}
                            isEditing={isEditing}
                            styles={styles}
                            onRemove={() => handleRemoveItem(item.id)}
                        />
                    ) : null}
                </TouchableOpacity>
            )
        }));
    }, [board?.items, metricStates, isEditing, handleOpenMetricDetails, handleRemoveItem]);

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
                                Add metrics or buttons to get started
                            </Text>
                        </View>
                    ) : (
                        <GridLayout
                            items={getGridItems()}
                            cols={12}
                            rowHeight={100}
                            margin={[10, 10]}
                            isDraggable={isEditing}
                            onLayoutChange={updateLayout}
                            containerStyle={styles.gridContainer}
                        />
                    )}

                    {isEditing && (
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
                                onPalette={handleOpenDisplaySettings}
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
        backgroundColor: 'rgba(255,255,255,0.9)'
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
    // Button Card Styles
    buttonContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative'
    },
    buttonEditOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        zIndex: 10
    },
    buttonWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8
    },
    buttonWrapperEditing: {
        opacity: 0.7
    },
    button: {
        width: '100%'
    },
    buttonContent: {
        paddingVertical: 8
    },
    buttonLabel: {
        fontSize: 14,
        fontWeight: '600'
    },
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
