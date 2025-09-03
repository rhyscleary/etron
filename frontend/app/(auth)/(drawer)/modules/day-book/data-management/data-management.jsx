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
import { Link, router } from "expo-router";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";

import {
  getAdapterInfo,
  getCategoryDisplayName,
} from "../../../../../../adapters/day-book/data-sources/DataAdapterFactory";
import useDataSources from "../../../../../../hooks/useDataSource";

import DataConnectionButton from "../../../../../../components/common/buttons/DataConnectionButton";

import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import { list } from "aws-amplify/storage";

const DataManagement = () => {
  const [dataSourcePaths, setDataSourcePaths] = useState([]);
  const [loadingDataSourcePaths, setLoadingDataSourcePaths] = useState(true);
  useEffect(() => {
    async function getWorkspaceDataSources() {
      const workspaceId = await getWorkspaceId();
      const filePathPrefix = `workspaces/${workspaceId}/day-book/dataSources/`
      try {
        const result = await list ({
          path: filePathPrefix,
          options: {
            bucket: 'workspaces',
          }
        });
        setDataSourcePaths(Array.from(new Set(  // Set prevents duplicates
          result.items.map((item) => item.path
            .slice(filePathPrefix.length)  // Cuts off file path
            .split('/')[0]  // Cuts off everything inside the folder
          )
        )));
        setLoadingDataSourcePaths(false);
      } catch (error) {
        console.log("Error getting workspace data sources:", error);
      }
    }
    getWorkspaceDataSources();
  }, []);

  const {
    dataSources,
    loading,
    error,
    stats,
    disconnectDataSource,
    testConnection,
    syncDataSource,
    refresh,
  } = useDataSources();

  const handleDisconnectSource = (sourceId, sourceName) => {
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
              // TODO: add success feedback
            } catch (error) {
              Alert.alert("Error", "Failed to disconnect data source");
            }
          },
        },
      ]
    );
  };

  const handleSyncSource = async (sourceId) => {
    try {
      await syncDataSource(sourceId);
    } catch (error) {
      Alert.alert("Sync Failed", error.message);
    }
  };

  const handleTestConnection = async (sourceId) => {
    try {
      await testConnection(sourceId);
      Alert.alert("Success", "Connection test successful");
    } catch (error) {
      Alert.alert("Connection Test Failed", error.message);
    }
  };

  const formatLastSync = (dateString) => {
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
  };

  const renderDataSourceCard = (source) => {
    const adapterInfo = getAdapterInfo(source.type);
    if (!adapterInfo) return null;

    const isProcessing =
      source.status === "syncing" || source.status === "testing";

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
  };

  const groupSourcesByCategory = () => {
    const grouped = {};
    dataSources.forEach((source) => {
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
  };

  if (loading) {
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

  if (error) {
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
          <Pressable style={styles.retryButton} onPress={refresh}>
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
      <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/profile")} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Grouped Data Sources */}
        {loadingDataSourcePaths && (
          <ActivityIndicator />
        )}
        {!loadingDataSourcePaths && (
          dataSourcePaths.map((path) => { return (
            <TouchableOpacity 
              key = {path}
              onPress={() => {router.navigate(`./view-data-source/${path}`)}}
            >
              <Card>
                {<Text>
                  {path}
                </Text>}
              </Card>
            </TouchableOpacity>
          )})
        )}
        {Object.entries(groupedSources).map(([category, sources]) => (
          <View key={category} style={styles.categorySection}>
            <Text variant="titleMedium" style={styles.categoryTitle}>
              {getCategoryDisplayName(category)}
            </Text>
            {sources.map(renderDataSourceCard)}
          </View>
        ))}
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
});
