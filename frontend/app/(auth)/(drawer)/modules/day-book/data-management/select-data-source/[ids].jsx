// Author(s): Holly Wyatt

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Text, Card, DataTable, useTheme, Dialog, Portal, TextInput, Switch, List, IconButton } from "react-native-paper";
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
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editMode, setEditMode] = useState('add'); // 'add' | 'update'
  const [editingRow, setEditingRow] = useState(null); // original row object
  const [rowDataDraft, setRowDataDraft] = useState('{}');
  const [persistent, setPersistent] = useState(true);
  const [ttlSeconds, setTtlSeconds] = useState('3600');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [tableColumns, setTableColumns] = useState(['field']);
  const [tableRows, setTableRows] = useState([{ field: '' }]);
  const [useTableMode, setUseTableMode] = useState(true);
  const [existingDataCollapsed, setExistingDataCollapsed] = useState(true); // auto hidden by default
  // When true we show the Add Data editor inline instead of a dialog
  const [inlineAddActive, setInlineAddActive] = useState(false);
  // Track if we've seeded the add form from preview to avoid overwriting user edits
  const seededFromPreviewRef = React.useRef(false);
  const originalRowsRef = React.useRef([]);

  // Shared preview/table rendering used by both the main preview card and accordion
  const renderPreviewContent = (preview, { limitRowsToggle = true, onRowPress, forceAll = false } = {}) => {
    if (!preview || preview.error) return <Text>Error: {preview?.error}</Text>;
    const allRows = Array.isArray(preview.data) ? preview.data : [];
    const inferHeaders = () => {
      if (Array.isArray(preview.headers) && preview.headers.length) return preview.headers;
      const sample = allRows.slice(0, 50);
      const isObjectRows = sample.some((r) => r && typeof r === 'object' && !Array.isArray(r));
      if (!isObjectRows) return ['value'];
      const set = new Set();
      sample.forEach((r) => { if (r && typeof r === 'object') Object.keys(r).forEach((k) => set.add(k)); });
      return Array.from(set);
    };
    const headers = inferHeaders();
  const toDisplayRows = forceAll ? allRows : allRows.slice(0, showAllRows ? 25 : 10);
    const formatVal = (v) => {
      if (v == null) return '';
      const isDateLike = (s) => typeof s === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s);
      if (typeof v === 'string') {
        if (isDateLike(v)) { try { return new Date(v).toLocaleString(); } catch { return v; } }
        return v.length > 200 ? v.slice(0, 200) + '…' : v;
      }
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      try { const s = JSON.stringify(v); return s.length > 200 ? s.slice(0,200)+'…' : s; } catch { return String(v); }
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
          <Text variant="labelLarge">Rows: {totalRows} • Columns: {totalCols}{forceAll ? '' : ` • Showing first ${showAllRows ? 25 : 10}`}</Text>
          {(!forceAll) && limitRowsToggle && totalRows > 10 && (
            <Button mode="text" onPress={() => setShowAllRows(v => !v)}>
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
                    <DataTable.Cell key={h} style={{ minWidth: 140 }} onPress={() => onRowPress && onRowPress(obj)}>
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
  };

  // Reusable accordion component for existing data preview
  const ExistingDataAccordion = ({ preview }) => {
    if (!preview || preview.error) return null;
    const rows = Array.isArray(preview.data) ? preview.data : [];
    return (
      <List.Section style={{ marginBottom: 12 }}>
        <List.Accordion
          title={`Existing Data (${rows.length} rows)`}
          expanded={!existingDataCollapsed}
          onPress={() => setExistingDataCollapsed(v => !v)}
          right={props => <List.Icon {...props} icon={existingDataCollapsed ? 'chevron-down' : 'chevron-up'} />}
        >
          {renderPreviewContent(preview, { onRowPress: (row) => openUpdateDialog(row), forceAll: true, limitRowsToggle: false })}
        </List.Accordion>
      </List.Section>
    );
  };

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

  const resolvedSourceId = () => existingSource?.id || existingSource?._id || existingSource?.dataSourceId || sourceId;

  const closeEditDialog = () => {
    if (savingEdit) return; // prevent closing while saving
    setEditDialogVisible(false);
  };

  const seedFromPreviewData = (pd) => {
    if (!pd || pd.error || !Array.isArray(pd.data) || !pd.data.length) return;
    const cols = (pd.headers && pd.headers.length ? pd.headers : Object.keys(pd.data[0] || {}));
    const limitedCols = cols.slice(0, 25);
    setTableColumns(limitedCols);
    const mapped = pd.data.slice(0, 50).map(r => {
      if (r && typeof r === 'object' && !Array.isArray(r)) {
        const obj = {};
        limitedCols.forEach(c => { obj[c] = r[c] != null ? String(r[c]) : ''; });
        if (r.id || r._id || r.rowId) obj.__rowId = r.id || r._id || r.rowId;
        return obj;
      }
      return { value: String(r) };
    });
    setTableRows(mapped.length ? mapped : [{ [limitedCols[0] || 'field']: '' }]);
    originalRowsRef.current = mapped;
    seededFromPreviewRef.current = true;
    // Prefill JSON draft with an array of mapped rows (strip internal ids)
    if (mapped && mapped.length) {
      const plainArray = mapped.map(r => { const cp = { ...r }; delete cp.__rowId; return cp; });
      try { setRowDataDraft(JSON.stringify(plainArray, null, 2)); } catch { /* ignore */ }
    }
  };

  const openAddDialog = async () => {
    setEditMode('add');
    setEditingRow(null);
    setRowDataDraft('{}'); // will be replaced by seedFromPreviewData if preview exists
    setPersistent(true);
    setTtlSeconds('3600');
    setEditError(null);
    setUseTableMode(true);
    // Always start hidden when entering add mode
    setExistingDataCollapsed(true);
    // Reset seeding tracking
    seededFromPreviewRef.current = false;
    // If preview already available seed immediately else start blank
    if (previewData && !previewData.error) {
      seedFromPreviewData(previewData);
    } else {
      setTableColumns(['field']);
      setTableRows([{ field: '' }]);
      originalRowsRef.current = [{ field: '' }];
    }
    // Activate inline mode instead of dialog
    setInlineAddActive(true);
    if (!previewData && existingSource) {
      try { await handleViewData(); } catch {}
    }
  };

  const openUpdateDialog = (row) => {
    setEditMode('update');
    setEditingRow(row);
    try { setRowDataDraft(JSON.stringify(row, null, 2)); } catch { setRowDataDraft('{}'); }
    setPersistent(false);
    setTtlSeconds('3600');
    setEditError(null);
    // derive table mode from row keys
    const keys = Object.keys(row || {});
    if (keys.length) {
      setUseTableMode(true);
      setTableColumns(keys.slice(0, 25));
      const obj = {};
      keys.slice(0,25).forEach(k => { obj[k] = row[k] != null ? String(row[k]) : ''; });
      setTableRows([obj]);
    } else {
      setUseTableMode(true);
      setTableColumns(['field']);
      setTableRows([{ field: '' }]);
    }
    setEditDialogVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!existingSource) return;
    setSavingEdit(true);
    setEditError(null);
    let parsed;
    if (useTableMode) {
      if (!tableColumns.length) {
        setEditError('At least one column required');
        setSavingEdit(false);
        return;
      }
      if (editMode === 'add') {
        const edits = [];
        tableRows.forEach((row, idx) => {
          const obj = {};
          tableColumns.forEach(c => { if (row[c] != null && row[c] !== '') obj[c] = row[c]; });
          if (!Object.keys(obj).length) return;
          const orig = originalRowsRef.current[idx];
          if (orig && orig.__rowId) {
            let changed = false;
            tableColumns.forEach(c => { if ((orig[c] || '') !== (row[c] || '')) changed = true; });
            if (changed) edits.push({ action: 'update', rowId: orig.__rowId, changes: obj, persistent });
          } else if (orig) {
            let differs = false;
            tableColumns.forEach(c => { if ((orig[c] || '') !== (row[c] || '')) differs = true; });
            if (differs) edits.push({ action: 'add', data: obj, persistent });
          } else {
            edits.push({ action: 'add', data: obj, persistent });
          }
        });
        if (!edits.length) {
          setEditError('No changes to save');
          setSavingEdit(false);
          return;
        }
        if (!persistent && ttlSeconds) {
          const n = Number(ttlSeconds);
          if (Number.isFinite(n) && n > 0) edits.forEach(e => { if (!e.persistent) e.ttlSeconds = Math.floor(n); });
        }
        try {
          const dsId = resolvedSourceId();
          await dataSourceService.applyDataEdits(dsId, { edits });
          await handleViewData();
          if (inlineAddActive && editMode === 'add') {
            setInlineAddActive(false);
          } else {
            setEditDialogVisible(false);
          }
        } catch (err) {
          setEditError(err?.message || 'Failed to save');
        } finally {
          setSavingEdit(false);
        }
        return;
      } else {
        const row = tableRows[0] || {};
        const obj = {};
        tableColumns.forEach(c => { if (row[c] != null && row[c] !== '') obj[c] = row[c]; });
        parsed = obj;
      }
    } else {
      try {
        parsed = JSON.parse(rowDataDraft);
        if (Array.isArray(parsed)) {
          if (!parsed.every(o => o && typeof o === 'object' && !Array.isArray(o))) throw new Error('All array items must be plain objects');
        } else if (!parsed || typeof parsed !== 'object') {
          throw new Error('Root must be an object or an array of objects');
        }
      } catch (e) {
        setEditError('Invalid JSON: ' + e.message);
        setSavingEdit(false);
        return;
      }
    }
    let ttl = undefined;
    if (!persistent) {
      if (ttlSeconds.trim() === '') {
        setEditError('TTL required when not persistent');
        setSavingEdit(false);
        return;
      }
      const n = Number(ttlSeconds);
      if (!Number.isFinite(n) || n <= 0) {
        setEditError('TTL must be a positive number');
        setSavingEdit(false);
        return;
      }
      ttl = Math.floor(n);
    }
    try {
      let editsPayload = [];
      if (editMode === 'add') {
        if (Array.isArray(parsed)) {
          editsPayload = parsed.map(obj => ({ action: 'add', data: obj, persistent }));
        } else {
          editsPayload = [{ action: 'add', data: parsed, persistent }];
        }
      } else {
        editsPayload = [{ action: 'update', rowId: editingRow?.id || editingRow?._id || editingRow?.rowId, changes: parsed, persistent }];
      }
      if (!persistent && ttl) editsPayload.forEach(e => { if (!e.persistent) e.ttlSeconds = ttl; });
      const dsId = resolvedSourceId();
      await dataSourceService.applyDataEdits(dsId, { edits: editsPayload });
      await handleViewData();
      if (inlineAddActive && editMode === 'add') {
        setInlineAddActive(false);
      } else {
        setEditDialogVisible(false);
      }
    } catch (err) {
      setEditError(err?.message || 'Failed to save');
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelInlineAdd = () => {
    if (savingEdit) return;
    setInlineAddActive(false);
  };

  // When preview data loads after entering inline add mode, seed the table once
  useEffect(() => {
    if (inlineAddActive && !seededFromPreviewRef.current && previewData && !previewData.error) {
      seedFromPreviewData(previewData);
    }
  }, [inlineAddActive, previewData]);

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
    <>
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
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
                    {inlineAddActive ? (
                      // When editing inline we hide View Data and instead could show a Return to Preview button
                      <Button onPress={() => setInlineAddActive(false)} mode="contained" style={{ marginRight: 8, marginBottom: 8 }}>
                        Back To Preview
                      </Button>
                    ) : previewData && !previewData.error ? (
                      // Once preview is loaded, offer Edit Data instead of View Data
                      <Button onPress={openAddDialog} mode="contained" style={{ marginRight: 8, marginBottom: 8 }}>
                        Edit Data
                      </Button>
                    ) : (
                      // No preview yet: show View Data
                      <Button onPress={handleViewData} mode="contained" disabled={previewLoading} style={{ marginRight: 8, marginBottom: 8 }}>
                        {previewLoading ? 'Loading...' : 'View Data'}
                      </Button>
                    )}
                    {editHref ? (
                      <Link href={editHref} asChild>
                        <Button mode="outlined" style={{ marginRight: 8, marginBottom: 8 }}>Edit Connection Details</Button>
                      </Link>
                    ) : (
                      <Button mode="outlined" disabled style={{ marginRight: 8, marginBottom: 8 }}>
                        Edit Connection Details
                      </Button>
                    )}
                  </View>
                </View>
              </View>
            </Card>
    {inlineAddActive ? (
              <Card style={{ margin: 16 }}>
                <Card.Title title="Edit Data" right={() => (
                  <Button
                    mode="text"
                    compact
                    onPress={() => {
                      const dsId = resolvedSourceId();
                      if (dsId) router.push(`/modules/day-book/data-management/full-edit-data/${encodeURIComponent(String(dsId))}`);
                    }}
                  >Full Screen</Button>
                )} />
                <View style={{ padding: 12 }}>
                  {/* Inline editor reused from dialog (add mode) */}
      <ExistingDataAccordion preview={previewData} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text variant="labelSmall">{useTableMode ? 'Table Editor' : 'Raw JSON Editor'}</Text>
                    <Button compact mode="text" onPress={() => {
                      setUseTableMode(v => {
                        if (v) {
                          const arr = tableRows.map(r => { const cp = { ...r }; delete cp.__rowId; return cp; });
                          try { setRowDataDraft(JSON.stringify(arr, null, 2)); } catch { /* ignore */ }
                        }
                        return !v;
                      });
                    }}>{useTableMode ? 'Use JSON' : 'Use Table'}</Button>
                  </View>
                  {useTableMode ? (
                    <View style={{ borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: 4, padding: 4, marginBottom: 12 }}>
                      <ScrollView horizontal>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                              {tableColumns.map((col, ci) => (
                                <View key={col + ci} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <TextInput
                                    mode="flat"
                                    value={col}
                                    onChangeText={(val) => {
                                      setTableColumns(prev => prev.map((c, idx) => idx === ci ? (val || '') : c));
                                      setTableRows(prev => prev.map(r => {
                                        if (!(col in r)) return r;
                                        const { [col]: oldVal, ...rest } = r;
                                        return { ...rest, [val || '']: oldVal };
                                      }));
                                    }}
                                    style={{ width: 120, backgroundColor: 'transparent' }}
                                  />
                                  <IconButton
                                    icon="minus"
                                    size={16}
                                    onPress={() => {
                                      if (tableColumns.length === 1) return;
                                      setTableColumns(prev => prev.filter((_, idx) => idx !== ci));
                                      setTableRows(prev => prev.map(r => { const nr = { ...r }; delete nr[col]; return nr; }));
                                    }}
                                  />
                                </View>
                              ))}
                            </View>
                            <Button
                              compact
                              mode="text"
                              onPress={() => {
                                let base = 'col';
                                let i = 1;
                                while (tableColumns.includes(base + i)) i++;
                                setTableColumns(prev => [...prev, base + i]);
                                setTableRows(prev => prev.map(r => ({ ...r, [base + i]: '' })));
                              }}
                              style={{ marginLeft: 4 }}
                            >
                              Add Column
                            </Button>
                          </View>
                          {tableRows.map((row, ri) => (
                            <View key={ri} style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {tableColumns.map((col, ci) => (
                                <TextInput
                                  key={col + ci}
                                  mode="outlined"
                                  value={row[col] != null ? String(row[col]) : ''}
                                  onChangeText={(val) => setTableRows(prev => prev.map((r, idx) => idx === ri ? { ...r, [col]: val } : r))}
                                  style={{ width: 120, margin: 2 }}
                                />
                              ))}
                              <IconButton
                                icon="minus"
                                size={16}
                                onPress={() => {
                                  if (tableRows.length === 1) return;
                                  setTableRows(prev => prev.filter((_, idx) => idx !== ri));
                                }}
                              />
                            </View>
                          ))}
                          <Button
                            compact
                            mode="text"
                            onPress={() => setTableRows(prev => [...prev, Object.fromEntries(tableColumns.map(c => [c, '']))])}
                            style={{ alignSelf: 'flex-start', marginTop: 4 }}
                          >
                            Add Row
                          </Button>
                        </View>
                      </ScrollView>
                    </View>
                  ) : (
                    <TextInput
                      mode="outlined"
                      multiline
                      numberOfLines={8}
                      value={rowDataDraft}
                      onChangeText={setRowDataDraft}
                      style={{ maxHeight: 200, marginBottom: 12 }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ marginRight: 8 }}>Persistent</Text>
                    <Switch value={persistent} onValueChange={setPersistent} />
                  </View>
                  {!persistent && (
                    <TextInput
                      mode="outlined"
                      label="TTL Seconds"
                      keyboardType="numeric"
                      value={ttlSeconds}
                      onChangeText={setTtlSeconds}
                      style={{ marginBottom: 12 }}
                    />
                  )}
                  {editError ? <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{editError}</Text> : null}
                  <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 12 }}>
                    {persistent ? 'This change will be stored permanently.' : 'This change will expire after the TTL or next data source refresh.'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Button onPress={cancelInlineAdd} disabled={savingEdit} style={{ marginRight: 8, marginBottom: 8 }}>Cancel</Button>
                    <Button onPress={handleSaveEdit} loading={savingEdit} disabled={savingEdit} mode="contained" style={{ marginBottom: 8 }}>Save</Button>
                  </View>
                </View>
              </Card>
            ) : previewData ? (
              <Card style={{ margin: 16 }}>
                <Card.Title title="Preview" />
                <View style={{ padding: 12 }}>
                  {previewData.error ? (<Text>Error: {previewData.error}</Text>) : renderPreviewContent(previewData, { onRowPress: (row) => openUpdateDialog(row) })}
                </View>
              </Card>
            ) : null}
            </>
          ) : null
        ) : (
          adapters.map(({ type, info }) => (
            <Card key={type} style={styles.card} onPress={() => handleSelect(type)}>
              <Card.Title
                title={info?.name || type}
                subtitle={info?.description || "No description"}
              />
            </Card>
          ))
        )}
      </ScrollView>
  </View>
  <Portal>
      <Dialog visible={editDialogVisible && !inlineAddActive} onDismiss={closeEditDialog} style={{ maxHeight: '90%' }}>
        <Dialog.Title>{editMode === 'add' ? 'Edit Data' : 'Edit Data'}</Dialog.Title>
        <Dialog.Content>
          {editMode === 'add' && previewData && !previewData.error ? (
            <ExistingDataAccordion preview={previewData} />
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text variant="labelSmall">{useTableMode ? 'Table Editor' : 'Raw JSON Editor'}</Text>
            <Button compact mode="text" onPress={() => {
              setUseTableMode(v => {
                if (v) {
                  const arr = tableRows.map(r => { const cp = { ...r }; delete cp.__rowId; return cp; });
                  try { setRowDataDraft(JSON.stringify(arr, null, 2)); } catch { /* ignore */ }
                }
                return !v;
              });
            }}>{useTableMode ? 'Use JSON' : 'Use Table'}</Button>
          </View>
          {useTableMode ? (
            <View style={{ borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: 4, padding: 4, marginBottom: 12 }}>
              <ScrollView horizontal>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                      {tableColumns.map((col, ci) => (
                        <View key={col + ci} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TextInput
                            mode="flat"
                            value={col}
                            onChangeText={(val) => {
                              setTableColumns(prev => prev.map((c, idx) => idx === ci ? (val || '') : c));
                              setTableRows(prev => prev.map(r => {
                                if (!(col in r)) return r;
                                const { [col]: oldVal, ...rest } = r;
                                return { ...rest, [val || '']: oldVal };
                              }));
                            }}
                            style={{ width: 120, backgroundColor: 'transparent' }}
                          />
                          <IconButton
                            icon="minus"
                            size={16}
                            onPress={() => {
                              if (tableColumns.length === 1) return; // keep at least one
                              setTableColumns(prev => prev.filter((_, idx) => idx !== ci));
                              setTableRows(prev => prev.map(r => { const nr = { ...r }; delete nr[col]; return nr; }));
                            }}
                          />
                        </View>
                      ))}
                    </View>
                    <Button
                      compact
                      mode="text"
                      onPress={() => {
                        let base = 'col';
                        let i = 1;
                        while (tableColumns.includes(base + i)) i++;
                        setTableColumns(prev => [...prev, base + i]);
                        setTableRows(prev => prev.map(r => ({ ...r, [base + i]: '' })));
                      }}
                      style={{ marginLeft: 4 }}
                    >
                      Add Column
                    </Button>
                  </View>
                  {tableRows.map((row, ri) => (
                    <View key={ri} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {tableColumns.map((col, ci) => (
                        <TextInput
                          key={col + ci}
                          mode="outlined"
                          value={row[col] != null ? String(row[col]) : ''}
                          onChangeText={(val) => setTableRows(prev => prev.map((r, idx) => idx === ri ? { ...r, [col]: val } : r))}
                          style={{ width: 120, margin: 2 }}
                        />
                      ))}
                      <IconButton
                        icon="minus"
                        size={16}
                        onPress={() => {
                          if (tableRows.length === 1) return; // keep at least one
                          setTableRows(prev => prev.filter((_, idx) => idx !== ri));
                        }}
                      />
                    </View>
                  ))}
                  <Button
                    compact
                    mode="text"
                    onPress={() => setTableRows(prev => [...prev, Object.fromEntries(tableColumns.map(c => [c, '']))])}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    Add Row
                  </Button>
                </View>
              </ScrollView>
            </View>
          ) : (
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={8}
              value={rowDataDraft}
              onChangeText={setRowDataDraft}
              style={{ maxHeight: 200, marginBottom: 12 }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ marginRight: 8 }}>Persistent</Text>
            <Switch value={persistent} onValueChange={setPersistent} />
          </View>
          {!persistent && (
            <TextInput
              mode="outlined"
              label="TTL Seconds"
              keyboardType="numeric"
              value={ttlSeconds}
              onChangeText={setTtlSeconds}
              style={{ marginBottom: 12 }}
            />
          )}
          {editError ? <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{editError}</Text> : null}
          <Text variant="bodySmall" style={{ opacity: 0.7 }}>
            {persistent ? 'This change will be stored permanently.' : 'This change will expire after the TTL or next data source refresh.'}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={{ flexWrap: 'wrap' }}>
          <Button onPress={closeEditDialog} disabled={savingEdit} style={{ marginRight: 8, marginBottom: 8 }}>Cancel</Button>
          <Button onPress={handleSaveEdit} loading={savingEdit} disabled={savingEdit} mode="contained" style={{ marginBottom: 8 }}>Save</Button>
        </Dialog.Actions>
      </Dialog>
  </Portal>
  </>
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
