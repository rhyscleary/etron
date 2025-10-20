// Author(s): Holly Wyatt, Noah Bradley

// DataManagement.js
import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshControl } from "react-native";
import { Pressable, ScrollView, View, StyleSheet, Alert, TouchableOpacity, Button } from "react-native";
import { Card } from "react-native-paper";
import { Text, ActivityIndicator } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { getAdapterInfo, getCategoryDisplayName, } from "../../../../../../adapters/day-book/data-sources/DataAdapterFactory";
import { useApp } from "../../../../../../contexts/AppContext";

import DataConnectionButton from "../../../../../../components/common/buttons/DataConnectionButton";

import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import endpoints from "../../../../../../utils/api/endpoints";
import { apiGet } from "../../../../../../utils/api/apiClient";
import ResponsiveScreen from "../../../../../../components/layout/ResponsiveScreen";
import useDataSource from "../../../../../../hooks/useDataSource";
import BasicButton from "../../../../../../components/common/buttons/BasicButton";

const DataManagement = () => {
	// Use the app context
	const { dataSources, system, actions } = useApp();
	
	const {
		list: dataSourcesList,
		count,
		connected,
		errors,
		isDemoMode,
		updateTrigger
	} = dataSources;

	const {
		isLoading: loading,
		hasError,
		error
	} = system;

	const {
		disconnectDataSource,
		refreshDataSources: refresh,
		connectDataSource,
		connectProvider,
		forceUpdate
	} = actions;

	// Track previous data sources count for change detection
	const prevCountRef = useRef(count);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastManualRefresh, setLastManualRefresh] = useState(0);
	const hasInitiallyLoadedRef = useRef(false);

	// refresh data sources list (used by pull-to-refresh and retry)
	const handleRefresh = useCallback(async () => {
		try {
			setIsRefreshing(true);
			console.log('[DataManagement] manual refresh triggered');
			await refresh();
			setLastManualRefresh(Date.now());
		} catch (err) {
			console.error('[DataManagement] handleRefresh error', err);
			Alert.alert('Refresh failed', 'Unable to refresh data sources.');
		} finally {
			setIsRefreshing(false);
		}
	}, [refresh]);

	// Auto-refresh when data sources count changes
	useEffect(() => {
		if (prevCountRef.current !== count) {
			console.log(`Data sources count changed: ${prevCountRef.current} -> ${count}`);
			prevCountRef.current = count;
			
			// Optional: Show a brief success message when new source is added
			if (count > prevCountRef.current) {
				console.log('New data source added successfully!');
			}
		}
	}, [count]);

	// Auto-refresh when updateTrigger changes
	useEffect(() => {
		console.log('Update trigger changed, refreshing UI...');
	}, [updateTrigger]);

	// Trace local system/loading state
	useEffect(() => {
		console.log('[DataManagement] system loading ->', loading, 'hasError ->', hasError, 'error ->', error ?? null);
	}, [loading, hasError, error]);

	// Trace list changes as seen by the screen
	useEffect(() => {
		console.log('[DataManagement] dataSourcesList length ->', dataSourcesList.length);
	}, [dataSourcesList.length]);

	// FIXED: Only refresh on initial focus, not every time
	useFocusEffect(
		useCallback(() => {
			if (!hasInitiallyLoadedRef.current) {
				console.log('DataManagement screen focused for first time, refreshing data...', { existingCount: dataSourcesList.length });
				refresh();
				hasInitiallyLoadedRef.current = true;
				console.log('DataManagement initial focus load flag set');
			} else {
				console.log('DataManagement screen focused, skipping refresh (already loaded)');
				console.log('[DataManagement] Current data sources on focus:', dataSourcesList.length, 'total');
				console.log('[DataManagement] Data sources on screen focus:');
				dataSourcesList.forEach((source, index) => {
					console.log(`	[${index + 1}] ID: ${source.id}, Type: ${source.type}, Name: ${source.name}, Status: ${source.status}`);
				});
			}
		}, [dataSourcesList]) // Include dataSourcesList to log current state
	);

	const formatLastSync = useCallback((dateString) => {
		if (!dateString) return "Unknown";
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${diffDays}d ago`;
	}, []);


	const { dataSourceService } = useDataSource();

	// request sync for a data source; use dataSourceService to fetch preview then refresh state
	const handleSyncSource = useCallback(async (sourceId) => {
		setIsRefreshing(true);
		try {
			if (dataSourceService && typeof dataSourceService.syncDataSource === 'function') {
				await dataSourceService.syncDataSource(sourceId);
			} else if (dataSourceService && typeof dataSourceService.viewData === 'function') {
				await dataSourceService.viewData(sourceId);
			} else {
				console.warn('[DataManagement] No dataSourceService.syncDataSource available, falling back to refresh');
			}

			if (typeof forceUpdate === 'function') {
				try { await forceUpdate(sourceId); } catch (err) { await forceUpdate(); }
			} else {
				refresh();
			}

			Alert.alert('Sync complete', 'Data source sync/preview completed successfully.');
		} catch (err) {
			console.error('[DataManagement] handleSyncSource error', err);
			Alert.alert('Error', 'Could not complete sync.');
		} finally {
			setIsRefreshing(false);
		}
	}, [dataSourceService, forceUpdate, refresh]);

	// confirm and disconnect a data source
	const handleDisconnectSource = useCallback((sourceId, sourceName) => {
		Alert.alert(
			'Disconnect data source',
			`Are you sure you want to disconnect "${sourceName || sourceId}"?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Disconnect', style: 'destructive', onPress: async () => {
					try {
						await disconnectDataSource(sourceId);
					} catch (err) {
						console.error('[DataManagement] disconnectDataSource error', err);
						Alert.alert('Error', 'Failed to disconnect data source.');
					}
				} }
			]
		);
	}, [disconnectDataSource]);

	// test connection (placeholder)
	const handleTestConnection = useCallback(async (sourceId) => {
		try {
			refresh();
			Alert.alert('Test Connection', 'Connection test requested.');
		} catch (err) {
			console.error('[DataManagement] handleTestConnection error', err);
			Alert.alert('Error', 'Connection test failed.');
		}
	}, [refresh]);

	const renderDataSourceCard = useCallback((source) => {
		const adapterInfo = getAdapterInfo(source.type);
		if (!adapterInfo) return null;

		return (
			<View key={source.id} style={{ marginBottom: 12 }}>
				<DataConnectionButton
					label={source.name}
					height={60}
					onNavigate={() => router.navigate(`/modules/day-book/data-management/select-data-source/${source.id}`)}
					onSync={() => handleSyncSource(source.id)}
					onDelete={() => handleDisconnectSource(source.id, source.name)}
					onTest={() => handleTestConnection(source.id)}
					onSettings={() => router.navigate(`/modules/day-book/data-management/edit-data-source/${source.id}`)}
				/>
			</View>
		);
	}, [handleSyncSource, handleDisconnectSource, handleTestConnection]);

	const groupSourcesByCategory = useCallback(() => {
		const grouped = {};
		dataSourcesList.forEach((source) => {
			const adapterInfo = getAdapterInfo(source.type);
			if (adapterInfo) {
				const category = adapterInfo.category;
				if (!grouped[category]) {
					grouped[category] = [];
				}
				grouped[category].push(source);
			}
		});
		return grouped;
	}, [dataSourcesList]);

	const groupedSources = groupSourcesByCategory();

	// Build the body based on loading/error/normal states
	let body = null;
	if (loading && !isRefreshing) {
		body = (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
				<Text style={styles.loadingText}>Loading data sources...</Text>
			</View>
		);
	} else if (hasError) {
		body = (
			<View style={styles.errorContainer}>
				<Text variant="headlineSmall" style={styles.errorTitle}>
					Unable to Load Data Sources
				</Text>
				<Text variant="bodyMedium" style={styles.errorMessage}>
					{error}
				</Text>
				<Pressable style={styles.retryButton} onPress={handleRefresh}>
					<Text style={styles.retryButtonText}>Try Again</Text>
				</Pressable>
			</View>
		);
	} else {
		body = (
			<ScrollView
				style={styles.container}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing || loading}
						onRefresh={handleRefresh}
						title="Pull to refresh"
					/>
				}
			>
				{/* Data Sources Summary */}
				{dataSourcesList.length > 0 && (
					<View style={styles.summarySection}>
						<Text variant="titleMedium" style={styles.summaryTitle}>
							Summary
						</Text>
						<View style={styles.summaryRow}>
							<Text>Total Sources: {count}</Text>
							<Text>Connected: {connected.length}</Text>
							<Text>Errors: {errors.length}</Text>
						</View>
						{/* Show last manual refresh time */}
						{lastManualRefresh > 0 && (
							<Text style={styles.lastUpdateText}>
								Last refreshed: {new Date(lastManualRefresh).toLocaleTimeString()}
							</Text>
						)}
					</View>
				)}

				<BasicButton
					label="Testing"
					onPress={() => router.navigate(`/modules/day-book/data-management/select-data-source/0987654321`)}
				/>

				{/* Grouped Data Sources */}
				{Object.entries(groupedSources).map(([category, sources]) => (
					<View key={category} style={styles.categorySection}>
						<Text variant="titleMedium" style={styles.categoryTitle}>
							{getCategoryDisplayName(category)} ({sources.length})
						</Text>
						{sources.map(renderDataSourceCard)}
					</View>
				))}

				{/* Empty State */}
				{dataSourcesList.length === 0 && !loading && (
					<View style={styles.emptyState}>
						<Text variant="headlineSmall" style={styles.emptyStateTitle}>
							No Data Sources Connected
						</Text>
						<Text variant="bodyMedium" style={styles.emptyStateMessage}>
							Connect your first data source to start tracking your data.
						</Text>
					</View>
				)}

				{/* Debug info in development */}
				{__DEV__ && (
					<View style={styles.debugSection}>
						<Text style={styles.debugText}>
							Debug: Update Trigger = {updateTrigger}, Sources = {count}
						</Text>
						<Text style={styles.debugText}>
							Initial Load: {hasInitiallyLoadedRef.current ? 'Yes' : 'No'}
						</Text>
					</View>
				)}
			</ScrollView>
		);
	}

	return (
		<ResponsiveScreen
			header={<Header
				title="Data Management"
				showMenu
				showPlus
				onRightIconPress={() => router.navigate("/modules/day-book/data-management/create-data-connection")}
			/>}
			center={false}
			padded={false}
			scroll={true}
		>

			{/* Demo Mode Indicator */}
			{isDemoMode && (
				<View style={styles.demoModeIndicator}>
					<Text style={styles.demoModeText}>
						Demo Mode - Sign in to sync your data sources
					</Text>
				</View>
			)}

			{body}
		</ResponsiveScreen>
	);
};

export default DataManagement;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 32,
	},
	retryButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	categorySection: {
		marginBottom: 24,
	},
	categoryTitle: {
		marginBottom: 12,
	},
	demoModeIndicator: {
		backgroundColor: '#FFF3CD',
		borderColor: '#FFEAA7',
		borderWidth: 1,
		padding: 12,
		marginHorizontal: 16,
		marginBottom: 8,
		borderRadius: 8,
	},
	demoModeText: {
		color: '#856404',
		textAlign: 'center',
		fontSize: 14,
	},
	summarySection: {
		marginBottom: 24,
		padding: 16,
		borderRadius: 8,
	},
	summaryTitle: {
		marginBottom: 8,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	lastUpdateText: {
		fontSize: 12,
		color: '#666',
		fontStyle: 'italic',
	},
	refreshButtonContainer: {
		marginBottom: 16,
		alignItems: 'center',
	},
	manualRefreshButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		backgroundColor: '#f0f0f0',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	refreshButtonText: {
		color: '#333',
		fontWeight: '500',
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		paddingVertical: 48,
	},
	emptyStateTitle: {
		marginBottom: 8,
		textAlign: 'center',
	},
	emptyStateMessage: {
		marginBottom: 24,
		textAlign: 'center',
		color: '#666',
	},
	addButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		backgroundColor: '#007AFF',
		borderRadius: 8,
	},
	addButtonText: {
		color: 'white',
		fontWeight: 'bold',
	},
	debugSection: {
		padding: 10,
		backgroundColor: '#f0f0f0',
		borderRadius: 5,
		marginTop: 20,
		marginBottom: 50,
	},
	debugText: {
		fontSize: 12,
		color: '#666',
	},
});