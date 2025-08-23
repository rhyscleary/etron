// Author(s): Holly Wyatt

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Text, Card, DataTable, useTheme } from "react-native-paper";
import { useLocalSearchParams, router, Link } from "expo-router";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import {
  getSupportedTypes,
  getAdapterInfo,
} from "../../../../../../../adapters/day-book/data-sources/DataAdapterFactory";
import useDataSources from "../../../../../../../hooks/useDataSource";
import { Button } from "react-native-paper";

const SelectDataSource = () => {
  const theme = useTheme();
  const { ids } = useLocalSearchParams();
  const { getDataSource, fetchDataSource, dataSourceService } = useDataSources();
  const lastFetchedIdRef = React.useRef(null);
  const sourceId = Array.isArray(ids) ? ids[0] : ids;

  const [existingSource, setExistingSource] = useState(null);
  const [adapters, setAdapters] = useState([]);
  const [loadingAdapters, setLoadingAdapters] = useState(true);
  const [loadingSource, setLoadingSource] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);

  // Compute edit href target once we have an id
  const navId = existingSource?.id || existingSource?._id || existingSource?.dataSourceId || sourceId;
  const editHref = navId
    ? `/modules/day-book/data-management/update-data-source/${encodeURIComponent(String(navId))}`
    : null;

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
      console.log('[SelectDataSource] Testing connection for preview', { id: existingSource.id, type: existingSource.type });
      const testRes = await dataSourceService.testConnection(
        existingSource.type,
        existingSource.config,
        existingSource.name
      );
      const tr = testRes?.testResult;
      // Normalize server test result into preview shape { headers: string[], data: any[] }
      const pickCandidate = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        return obj.sampleData ?? obj.data ?? obj.items ?? obj.results ?? obj.records ?? obj.rows ?? obj.value ?? obj;
      };
      let candidate = pickCandidate(tr);
      let data = [];
      if (Array.isArray(candidate)) data = candidate;
      else if (candidate && typeof candidate === 'object') data = [candidate];
      else if (tr && typeof tr === 'object') {
        // Try second-level pick if the first attempt was primitive
        const second = pickCandidate(Object.values(tr).find((v) => Array.isArray(v) || (v && typeof v === 'object')));
        if (Array.isArray(second)) data = second;
        else if (second && typeof second === 'object') data = [second];
      }
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const preview = { data, headers };
      console.log('[SelectDataSource] Preview (from testConnection):', { rows: data.length, cols: headers.length });
      setPreviewData(preview);
    } catch (err) {
      console.error('[SelectDataSource] Preview via testConnection failed:', err?.message || err);
      setPreviewData({ error: err?.message || String(err) });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Keep the old handler as a fallback if needed
  const handleEditSource = () => {
    if (!editHref) return;
    router.push(editHref);
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

  const createdAtValue = existingSource?.createdAt || existingSource?.lastSync || null;
  const createdAtText = createdAtValue ? (() => { try { return new Date(createdAtValue).toLocaleString(); } catch { return String(createdAtValue); } })() : null;

  return (
    <View style={commonStyles.screen}>
  <Header title={sourceId ? (existingSource?.name || "Data Source") : "New Connection"} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>
          {sourceId ? (createdAtText ? `Created: ${createdAtText}` : "Created: Unknown") : "Choose a Data Source"}
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
                  <View style={{ flexDirection: 'row' }}>
                    <Button onPress={handleViewData} mode="contained" disabled={previewLoading}>
                      {previewLoading ? 'Loading...' : 'View Data'}
                    </Button>
                    {editHref ? (
                      <Link href={editHref} asChild>
                        <Button mode="outlined">Edit Data Source</Button>
                      </Link>
                    ) : (
                      <Button mode="outlined" disabled>
                        Edit Data Source
                      </Button>
                    )}
                  </View>
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
                    (() => {
                      const allRows = Array.isArray(previewData.data) ? previewData.data : [];
                      // Build headers: prefer provided headers, else union of keys from first 50 rows, else ['value'] for primitives
                      const inferHeaders = () => {
                        if (Array.isArray(previewData.headers) && previewData.headers.length) return previewData.headers;
                        const sample = allRows.slice(0, 50);
                        const isObjectRows = sample.some((r) => r && typeof r === 'object' && !Array.isArray(r));
                        if (!isObjectRows) return ['value'];
                        const set = new Set();
                        sample.forEach((r) => { if (r && typeof r === 'object') Object.keys(r).forEach((k) => set.add(k)); });
                        return Array.from(set);
                      };
                      const headers = inferHeaders();
                      const toDisplayRows = allRows.slice(0, showAllRows ? 25 : 10);
                      const formatVal = (v) => {
                        if (v == null) return '';
                        const isDateLike = (s) => typeof s === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s);
                        if (typeof v === 'string') {
                          if (isDateLike(v)) { try { return new Date(v).toLocaleString(); } catch { return v; } }
                          return v.length > 200 ? v.slice(0, 200) + '…' : v;
                        }
                        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
                        // objects/arrays
                        try {
                          const s = JSON.stringify(v);
                          return s.length > 200 ? s.slice(0, 200) + '…' : s;
                        } catch {
                          return String(v);
                        }
                      };
                      const normalizeRow = (row) => {
                        if (row && typeof row === 'object' && !Array.isArray(row)) return row;
                        return { value: row };
                      };
                      const totalRows = allRows.length;
                      const totalCols = headers.length;
                      return (
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                            <Text variant="labelLarge">
                              Rows: {totalRows} • Columns: {totalCols} • Showing first {showAllRows ? 25 : 10}
                            </Text>
                            {totalRows > 10 && (
                              <Button mode="text" onPress={() => setShowAllRows((v) => !v)}>
                                {showAllRows ? 'Show 10' : 'Show 25'}
                              </Button>
                            )}
                          </View>
                          <ScrollView horizontal>
                            <DataTable>
                              <DataTable.Header>
                                {headers.map((h) => (
                                  <DataTable.Title key={h} style={{ minWidth: 140 }}>
                                    <Text style={{ fontWeight: '700' }}>{h}</Text>
                                  </DataTable.Title>
                                ))}
                              </DataTable.Header>
                              {toDisplayRows.map((row, idx) => {
                                const obj = normalizeRow(row);
                                const zebra = idx % 2 === 1;
                                return (
                                  <DataTable.Row key={idx} style={zebra ? { backgroundColor: theme.colors.primary } : null}>
                                    {headers.map((h) => (
                                      <DataTable.Cell key={h} style={{ minWidth: 140 }}>
                                        <Text style={zebra ? { color: '#000' } : null}>{formatVal(obj[h])}</Text>
                                      </DataTable.Cell>
                                    ))}
                                  </DataTable.Row>
                                );
                              })}
                            </DataTable>
                          </ScrollView>
                        </View>
                      );
                    })()
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
