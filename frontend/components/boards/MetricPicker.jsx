import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Card, Checkbox, Button, Chip, IconButton, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { getWorkspaceId } from '../../storage/workspaceStorage';
import endpoints from '../../utils/api/endpoints';
import { apiGet } from '../../utils/api/apiClient';

const MetricPicker = ({ onSelect, onCancel, multiSelect = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [metrics, setMetrics] = useState([]);
    const [filteredMetrics, setFilteredMetrics] = useState([]);
    const [selectedMetrics, setSelectedMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const workspaceId = await getWorkspaceId();
            const endpoint = endpoints.modules.day_book.metrics.getMetrics;
            const queryParams = { workspaceId };
            
            const response = await apiGet(endpoint, queryParams);
            
            let metricsData = [];
            if (response && response.data && Array.isArray(response.data)) {
                metricsData = response.data;
            }
            
            const transformedMetrics = metricsData
                .filter(metric => metric && typeof metric === 'object' && metric.metricId)
                .map(metric => {
                    const rawConfig = metric.config || {};
                    const dependentVariables = Array.isArray(rawConfig.dependentVariables)
                        ? rawConfig.dependentVariables
                        : [];
                    const selectedRows = Array.isArray(rawConfig.selectedRows)
                        ? rawConfig.selectedRows
                        : [];
                    const colours = Array.isArray(rawConfig.colours)
                        ? rawConfig.colours
                        : Array.isArray(rawConfig.colors)
                            ? rawConfig.colors
                            : [];

                    const chartType = rawConfig.type || 'line';
                    const independentVariable = rawConfig.independentVariable;

                    return {
                        id: metric.metricId,
                        metricId: metric.metricId,
                        name: metric.name || 'Unnamed Metric',
                        type: 'metric',
                        dataSourceId: metric.dataSourceId,
                        dataSourceName: metric.dataSourceName || metric.dataSourceLabel || metric.dataSource?.name,
                        chartType,
                        independentVariable,
                        dependentVariables,
                        colours,
                        selectedRows,
                        createdAt: metric.createdAt,
                        updatedAt: metric.updatedAt,
                        config: {
                            ...rawConfig,
                            type: chartType,
                            independentVariable,
                            dependentVariables,
                            selectedRows,
                            colours,
                            colors: rawConfig.colors || colours
                        }
                    };
                });
            
            setMetrics(transformedMetrics);
            setFilteredMetrics(transformedMetrics);
        } catch (err) {
            console.error('Error loading metrics:', err);
            setError('Failed to load metrics');
            setMetrics([]);
            setFilteredMetrics([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredMetrics(metrics);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = metrics.filter(metric =>
                metric.name?.toLowerCase().includes(query) ||
                metric.chartType?.toLowerCase().includes(query) ||
                metric.dependentVariables?.some(v => v.toLowerCase().includes(query))
            );
            setFilteredMetrics(filtered);
        }
    }, [searchQuery, metrics]);

    const handleToggleMetric = (metric) => {
        if (multiSelect) {
            setSelectedMetrics(prev =>
                prev.some(m => m.id === metric.id)
                    ? prev.filter(m => m.id !== metric.id)
                    : [...prev, metric]
            );
        } else {
            if (onSelect) {
                onSelect(metric);
            }
        }
    };

    const handleConfirm = () => {
        if (onSelect && selectedMetrics.length > 0) {
            onSelect(selectedMetrics);
        }
    };

    const handleCreateMetric = () => {
        router.push('/modules/day-book/metrics/create-metric');
    };

    const isSelected = (metricId) => {
        return selectedMetrics.some(m => m.id === metricId);
    };

    const renderMetricCard = ({ item: metric }) => {
        // Validate that we have a proper metric object
        if (!metric || typeof metric !== 'object' || !metric.metricId) {
            console.warn('Invalid metric item:', metric);
            return null;
        }

        // Get the dependent variables text
        const variablesText = metric.dependentVariables && Array.isArray(metric.dependentVariables) && metric.dependentVariables.length > 0
            ? metric.dependentVariables.join(', ')
            : 'No variables';

        return (
            <Card
                style={[
                    styles.metricCard,
                    isSelected(metric.id) && styles.metricCardSelected
                ]}
                onPress={() => handleToggleMetric(metric)}
            >
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                        <Text variant="titleMedium">{metric.name || 'Unnamed Metric'}</Text>
                        <Text variant="bodySmall" style={styles.description}>
                            {variablesText}
                        </Text>
                        <View style={styles.chips}>
                            <Chip mode="outlined" compact>
                                {metric.chartType || 'unknown'}
                            </Chip>
                            {metric.dependentVariables?.length > 0 && (
                                <Chip mode="outlined" compact>
                                    {metric.dependentVariables.length} variable{metric.dependentVariables.length > 1 ? 's' : ''}
                                </Chip>
                            )}
                        </View>
                    </View>
                    {multiSelect && (
                        <Checkbox
                            status={isSelected(metric.id) ? 'checked' : 'unchecked'}
                            onPress={() => handleToggleMetric(metric)}
                        />
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Loading metrics...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
                    <Button mode="contained" onPress={loadMetrics} style={styles.retryButton}>
                        Retry
                    </Button>
                </View>
            ) : (
                <>
                    <Searchbar
                        placeholder="Search metrics..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                    />

                    {/* Create New Metric Option - Only show if there are metrics or if searching */}
                    {(metrics.length > 0 || searchQuery) && (
                        <>
                            <TouchableOpacity onPress={handleCreateMetric}>
                                <Card style={styles.createMetricCard}>
                                    <Card.Content style={styles.createMetricContent}>
                                        <IconButton
                                            icon="plus-circle"
                                            size={24}
                                            style={styles.createMetricIcon}
                                        />
                                        <View style={styles.createMetricText}>
                                            <Text variant="titleMedium" style={styles.createMetricTitle}>
                                                Create New Metric
                                            </Text>
                                            <Text variant="bodySmall" style={styles.createMetricHint}>
                                                Go to Day Book to create a new metric
                                            </Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            </TouchableOpacity>

                            <Divider style={styles.divider} />
                        </>
                    )}

                    {multiSelect && selectedMetrics.length > 0 && (
                        <View style={styles.selectionBar}>
                            <Text variant="bodyMedium">
                                {selectedMetrics.length} selected
                            </Text>
                            <Button onPress={() => setSelectedMetrics([])}>
                                Clear
                            </Button>
                        </View>
                    )}

                    <FlatList
                        data={filteredMetrics}
                        renderItem={renderMetricCard}
                        keyExtractor={(item, index) => item?.id || item?.metricId || `metric-${index}`}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <IconButton icon="chart-box-outline" size={64} />
                                <Text variant="titleLarge" style={styles.emptyTitle}>
                                    {searchQuery ? 'No metrics found' : 'No Metrics Created Yet'}
                                </Text>
                                <Text variant="bodyMedium" style={styles.emptyHint}>
                                    {searchQuery
                                        ? 'Try a different search term or create a new metric'
                                        : 'You haven\'t created any metrics yet. Create your first metric to add it to this board.'}
                                </Text>
                                <Button
                                    mode="contained"
                                    onPress={handleCreateMetric}
                                    style={styles.createButton}
                                    icon="plus"
                                >
                                    Create Your First Metric
                                </Button>
                            </View>
                        }
                    />

                    {multiSelect && (
                        <View style={styles.footer}>
                            <Button
                                mode="outlined"
                                onPress={onCancel}
                                style={styles.footerButton}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleConfirm}
                                style={styles.footerButton}
                                disabled={selectedMetrics.length === 0}
                            >
                                Add {selectedMetrics.length > 0 ? `(${selectedMetrics.length})` : ''}
                            </Button>
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    loadingText: {
        marginTop: 16,
        opacity: 0.7
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    errorText: {
        color: '#d32f2f',
        marginBottom: 16,
        textAlign: 'center'
    },
    retryButton: {
        marginTop: 8
    },
    searchBar: {
        margin: 16,
        marginBottom: 8
    },
    createMetricCard: {
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#f5f5f5'
    },
    createMetricContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8
    },
    createMetricIcon: {
        margin: 0,
        marginRight: 8
    },
    createMetricText: {
        flex: 1
    },
    createMetricTitle: {
        fontWeight: '600',
        color: '#6200ee'
    },
    createMetricHint: {
        opacity: 0.7,
        marginTop: 2
    },
    divider: {
        marginHorizontal: 16,
        marginVertical: 8
    },
    selectionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    list: {
        padding: 16,
        paddingTop: 8
    },
    metricCard: {
        marginBottom: 12
    },
    metricCardSelected: {
        borderWidth: 2,
        borderColor: '#6200ee'
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardLeft: {
        flex: 1,
        marginRight: 12
    },
    description: {
        opacity: 0.7,
        marginTop: 4,
        marginBottom: 8
    },
    chips: {
        flexDirection: 'row',
        gap: 8
    },
    emptyState: {
        padding: 32,
        alignItems: 'center'
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        fontWeight: '600'
    },
    emptyHint: {
        opacity: 0.6,
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 16
    },
    createButton: {
        marginTop: 8
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0'
    },
    footerButton: {
        flex: 1
    }
});

export default MetricPicker;
