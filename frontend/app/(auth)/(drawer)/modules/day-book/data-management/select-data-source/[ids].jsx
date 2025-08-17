// Author(s): Holly Wyatt

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Text, Card } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import {
  getSupportedTypes,
  getAdapterInfo,
} from "../../../../../../../adapters/day-book/data-sources/DataAdapterFactory";
import useDataSources from "../../../../../../../hooks/useDataSource";
import apiClient from "../../../../../../../utils/api/apiClient";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

const SelectDataSource = () => {
  const authService = { getCurrentUser, fetchAuthSession, signOut };
  const { ids } = useLocalSearchParams();

  const { getDataSource, loading: dataSourcesLoading } = useDataSources(
    apiClient,
    authService
  );

  const [existingSource, setExistingSource] = useState(null);
  const [adapters, setAdapters] = useState([]);
  const [loadingAdapters, setLoadingAdapters] = useState(true);
  const [loadingSource, setLoadingSource] = useState(false);

  // Load available adapter types
  useEffect(() => {
    const loadAdapters = async () => {
      try {
        const types = await getSupportedTypes();
        const adapterList = types.map((type) => ({
          type,
          info: getAdapterInfo(type),
        }));
        setAdapters(adapterList);
      } catch (err) {
        console.error("Failed to load supported adapter types:", err);
      } finally {
        setLoadingAdapters(false);
      }
    };

    loadAdapters();
  }, []);

  // Load the source we're editing (if any)
  useEffect(() => {
    if (!ids) return;

    const fetchExisting = async () => {
      setLoadingSource(true);
      try {
        console.log("Loading existing data source for id:", ids);
        const source = await getDataSource(ids); // <-- await here
        setExistingSource(source);
      } catch (err) {
        console.error("Could not load data source:", err);
      } finally {
        setLoadingSource(false);
      }
    };

    fetchExisting();
  }, [ids, getDataSource]);

  const handleSelect = (adapterType) => {
    router.navigate(
      `/modules/day-book/data-management/configure-adapter/${adapterType}?sourceId=${ids || ""}`
    );
  };

  if (loadingAdapters || dataSourcesLoading || loadingSource) {
    return (
      <View style={[commonStyles.screen, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (ids && !existingSource) {
    return (
      <View style={commonStyles.screen}>
        <Header title="Edit Connection" showBack />
        <View style={styles.center}>
          <Text>No data source found for id "{ids}"</Text>
        </View>
      </View>
    );
  }

  const adapterInfo = existingSource ? getAdapterInfo(existingSource.type) : null;
  const subtitleText =
    typeof adapterInfo?.description === "string"
      ? adapterInfo.description
      : existingSource?.type;

  return (
    <View style={commonStyles.screen}>
      <Header title={ids ? "Edit Connection" : "New Connection"} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>
          {ids ? "Edit Data Source" : "Choose a Data Source"}
        </Text>

        {ids ? (
          existingSource ? (
            <Card style={styles.card}>
              <Card.Title
                title={
                  typeof existingSource.name === "string"
                    ? existingSource.name
                    : JSON.stringify(existingSource.name)
                }
                subtitle={subtitleText}
              />
              <View style={{ padding: 16 }}>
                <Text>Type: {String(existingSource.type)}</Text>
                <Text>Status: {String(existingSource.status)}</Text>
                <Text>Last Sync: {String(existingSource.lastSync)}</Text>
              </View>
            </Card>
          ) : null
        ) : (
          adapters.map(({ type, info }) => (
            <Pressable key={type} onPress={() => handleSelect(type)}>
              <Card style={styles.card}>
                <Card.Title
                  title={info?.name || type}
                  subtitle={info?.description || "No description"}
                />
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default SelectDataSource;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: "600",
  },
  card: {
    marginBottom: 12,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});
