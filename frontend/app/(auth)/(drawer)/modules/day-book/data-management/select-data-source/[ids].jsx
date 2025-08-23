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
import { Button } from "react-native-paper";

const SelectDataSource = () => {
  const { ids } = useLocalSearchParams();
  const { getDataSource, fetchDataSource } = useDataSources();
  const lastFetchedIdRef = React.useRef(null);
  const sourceId = Array.isArray(ids) ? ids[0] : ids;

  const [existingSource, setExistingSource] = useState(null);
  const [adapters, setAdapters] = useState([]);
  const [loadingAdapters, setLoadingAdapters] = useState(true);
  const [loadingSource, setLoadingSource] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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
    if (!sourceId) return;
    if (lastFetchedIdRef.current === sourceId) return; // guard against repeated fetches

    const fetchExisting = async () => {
      setLoadingSource(true);
      try {
        console.log("[SelectDataSource] Loading existing data source for id:", sourceId);
        const source = await getDataSource(sourceId);
        setExistingSource(source);
        lastFetchedIdRef.current = sourceId;
      } catch (err) {
        console.error("Could not load data source:", err);
      } finally {
        setLoadingSource(false);
      }
    };

    fetchExisting();
  }, [sourceId, getDataSource]);

  const handleSelect = (adapterType) => {
    router.navigate(
      `/modules/day-book/data-management/configure-adapter/${adapterType}?sourceId=${ids || ""}`
    );
  };

  const handleViewData = async () => {
    if (!existingSource) return;
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      console.log('Fetching preview data for', existingSource.id);
      const result = await fetchDataSource(existingSource.id, { endpoint: existingSource.config?.defaultEndpoint || '/' });
      console.log('Preview result:', result);
      setPreviewData(result);
    } catch (err) {
      console.error('Failed to fetch preview data:', err.message || err);
      setPreviewData({ error: err.message || String(err) });
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loadingAdapters || loadingSource) {
    return (
      <View style={[commonStyles.screen, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (sourceId && !existingSource) {
    return (
      <View style={commonStyles.screen}>
        <Header title="Edit Connection" showBack />
        <View style={styles.center}>
          <Text>No data source found for id "{String(sourceId)}"</Text>
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
  <Header title={sourceId ? "Edit Connection" : "New Connection"} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>
          {sourceId ? "Edit Data Source" : "Choose a Data Source"}
        </Text>

  {sourceId ? (
          existingSource ? (
            <>
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
                <View style={{ marginTop: 12 }}>
                  <Button onPress={handleViewData} mode="contained" disabled={previewLoading}>
                    {previewLoading ? 'Loading...' : 'View Data'}
                  </Button>
                </View>
              </View>
            </Card>
            {previewData ? (
              <Card style={{ margin: 16 }}>
                <Card.Title title="Preview" />
                <View style={{ padding: 12 }}>
                  {previewData.error ? (
                    <Text>Error: {previewData.error}</Text>
                  ) : (
                    <ScrollView horizontal>
                      <View>
                        <Text variant="labelLarge">Showing up to 10 rows</Text>
                        {previewData.headers && (
                          <View style={{ flexDirection: 'row', marginTop: 8 }}>
                            {previewData.headers.map((h) => (
                              <Text key={h} style={{ minWidth: 120, fontWeight: '600' }}>{h}</Text>
                            ))}
                          </View>
                        )}
                        {(previewData.data || []).slice(0, 10).map((row, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', marginTop: 8 }}>
                            {(previewData.headers || Object.keys(row)).map((h) => (
                              <Text key={h} style={{ minWidth: 120 }}>{String(row[h])}</Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              </Card>
            ) : null}
            </>
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
