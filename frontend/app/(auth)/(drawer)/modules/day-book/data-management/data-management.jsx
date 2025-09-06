// Author(s): Holly Wyatt, Noah Bradley

// DataManagement.js
import { useState, useEffect } from "react";
import { RefreshControl, Button } from "react-native";
import { Pressable, ScrollView, View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Card } from "react-native-paper";
import {
	Text,
	ActivityIndicator,
} from "react-native-paper";
import { Link, router, useFocusEffect } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";

import {
	getAdapterInfo,
	getCategoryDisplayName,
} from "../../../../../../adapters/day-book/data-sources/DataAdapterFactory";
import { useApp } from "../../../../../../contexts/AppContext";

import DataConnectionButton from "../../../../../../components/common/buttons/DataConnectionButton";

import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import { list } from "aws-amplify/storage";
import endpoints from "../../../../../../utils/api/endpoints";
import { apiGet } from "../../../../../../utils/api/apiClient";

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
          console.log(`  [${index + 1}] ID: ${source.id}, Type: ${source.type}, Name: ${source.name}, Status: ${source.status}`);
        });
      }
    }, [dataSourcesList]) // Include dataSourcesList to log current state
  );

  // Enhanced refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLastManualRefresh(Date.now());
    try {
      console.log('[DataManagement] Manual refresh triggered');
      await refresh();
      // Log all data sources after refresh
      console.log('[DataManagement] Data sources after refresh:', dataSourcesList.length, 'total');
      console.log('[DataManagement] All data sources in data-management page:');
      dataSourcesList.forEach((source, index) => {
        console.log(`  [${index + 1}] ID: ${source.id}, Type: ${source.type}, Name: ${source.name}, Status: ${source.status}`);
      });
      // Remove forceUpdate - refresh should handle state updates
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleDisconnectSource = useCallback(async (sourceId, sourceName) => {
    Alert.alert(
      "Disconnect Data Source",
      `Are you sure you want to disconnect "${sourceName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await disconnectDataSource(sourceId);
              // The context will handle the refresh automatically
              Alert.alert("Success", "Data source disconnected successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to disconnect data source");
            }
          },
        },
      ]
    );
  }, [disconnectDataSource]);

  const handleSyncSource = useCallback(async (sourceId) => {
    try {
      await refresh();
      Alert.alert("Success", "Data source synced successfully");
    } catch (error) {
      Alert.alert("Sync Failed", error.message);
    }
  }, [refresh]);

  const handleTestConnection = useCallback(async (sourceId) => {
    try {
      // Test connection logic would need to be implemented
      Alert.alert("Success", "Connection test successful");
    } catch (error) {
      Alert.alert("Connection Test Failed", error.message);
    }
  }, []);

  const formatLastSync = useCallback((dateString) => {
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

  const renderDataSourceCard = useCallback((source) => {
    const adapterInfo = getAdapterInfo(source.type);
    if (!adapterInfo) return null;

    const isProcessing = source.status === "syncing" || source.status === "testing";

    return (
      <View key={source.id} style={{ marginBottom: 12 }}>
        <DataConnectionButton
          label={source.name}
          height={60}
           onNavigate={() => {
            {
          router.navigate(
            `/modules/day-book/data-management/select-data-source/${source.id}`
          );}
        }}
          onSync={() => handleSyncSource(source.id)}
          onDelete={() => handleDisconnectSource(source.id, source.name)}
          onTest={() => handleTestConnection(source.id)}
          onSettings={() =>
            router.navigate(
              `/modules/day-book/data-management/update-data-source/${source.id}`
            )
          }
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

  // REMOVED: Auto-refresh timer - only refresh when actually needed
  // Instead, add a manual refresh button or pull-to-refresh only

  if (loading && !isRefreshing) {
    return (
      <View style={commonStyles.screen}>
        <Header
          title="Data Management"
          showMenu
          showPlus
          onRightIconPress={() =>
            router.navigate(
              "/modules/day-book/data-management/create-data-connection"
            )
          }
        />
        {/*Temporary redirect to profile screen*/}
        <Button title="Temporary - Back to Dashboard" onPress={() => router.push("/profile")} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading data sources...</Text>
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={commonStyles.screen}>
        <Header
          title="Data Management"
          showMenu
          showPlus
          onRightIconPress={() =>
            router.navigate(
              "/modules/day-book/data-management/create-data-connection"
            )
          }
        />
        {/*Temporary redirect to profile screen*/}
        <Button title="Temporary - Back to Dashboard" onPress={() => router.push("/profile")} />
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
      </View>
    );
  }

	const groupedSources = groupSourcesByCategory();

	return (
		<View style={commonStyles.screen}>
			<Header
				title="Data Management"
				showMenu
				showPlus
				onRightIconPress={() =>
					router.navigate(
						"/modules/day-book/data-management/create-data-connection"
					)
				}
			/>

      {/*Temporary redirect to profile screen*/}
      <Button title="Temporary - Back to Dashboard" onPress={() => router.push("/profile")} />

      {/* Demo Mode Indicator */}
      {isDemoMode && (
        <View style={styles.demoModeIndicator}>
          <Text style={styles.demoModeText}>
            Demo Mode - Sign in to sync your data sources
          </Text>
        </View>
      )}

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
            {/* Add Data Source button removed per request */}
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
    </View>
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