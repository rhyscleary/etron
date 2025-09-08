// Author(s): Holly Wyatt
// Full screen data editor
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Button, useTheme, TextInput, Switch, IconButton, DataTable } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import Header from '../../../../../../../../components/layout/Header';
import { commonStyles } from '../../../../../../../../assets/styles/stylesheets/common';
import useDataSources from '../../../../../../../../hooks/useDataSource';
import { getAdapterInfo } from '../../../../../../../../adapters/day-book/data-sources/DataAdapterFactory';

const FullEditData = () => {
  const theme = useTheme();
  const { ids } = useLocalSearchParams();
  const sourceId = Array.isArray(ids) ? ids[0] : ids;
  const { getDataSource, dataSourceService } = useDataSources();
  const [existingSource, setExistingSource] = useState(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [useTableMode, setUseTableMode] = useState(true);
  const [tableColumns, setTableColumns] = useState(['field']);
  const [tableRows, setTableRows] = useState([{ field: '' }]);
  const [rowDataDraft, setRowDataDraft] = useState('[]');
  const [persistent, setPersistent] = useState(true);
  const [ttlSeconds, setTtlSeconds] = useState('3600');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const seededRef = useRef(false);
  const originalRowsRef = useRef([]);

  const resolvedSourceId = () => existingSource?.id || existingSource?._id || existingSource?.dataSourceId || sourceId;

  useEffect(() => {
    if (!sourceId) return;
    const load = async () => {
      setLoadingSource(true);
      try {
        const src = await getDataSource(sourceId);
        setExistingSource(src);
      } catch (e) { console.error('Load source failed', e); }
      finally { setLoadingSource(false); }
    };
    load();
  }, [sourceId, getDataSource]);

  const handleViewData = async () => {
    if (!existingSource) return;
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const testRes = await dataSourceService.testConnection(existingSource.type, existingSource.config, existingSource.name);
      const tr = testRes?.testResult;
      const pickCandidate = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        return obj.sampleData ?? obj.data ?? obj.items ?? obj.results ?? obj.records ?? obj.rows ?? obj.value ?? obj;
      };
      let candidate = pickCandidate(tr);
      let data = [];
      if (Array.isArray(candidate)) data = candidate; else if (candidate && typeof candidate === 'object') data = [candidate];
      else if (tr && typeof tr === 'object') {
        const second = pickCandidate(Object.values(tr).find((v) => Array.isArray(v) || (v && typeof v === 'object')));
        if (Array.isArray(second)) data = second; else if (second && typeof second === 'object') data = [second];
      }
      const headers = data.length ? Object.keys(data[0]) : [];
      setPreviewData({ data, headers });
    } catch (e) {
      setPreviewData({ error: e?.message || String(e) });
    } finally { setPreviewLoading(false); }
  };

  const seedFromPreview = (pd) => {
    if (!pd || pd.error || !Array.isArray(pd.data) || !pd.data.length) return;
    const cols = pd.headers?.length ? pd.headers : Object.keys(pd.data[0] || {});
    const limitedCols = cols.slice(0, 50);
    setTableColumns(limitedCols);
    const mapped = pd.data.slice(0, 250).map(r => {
      if (r && typeof r === 'object' && !Array.isArray(r)) {
        const obj = {}; limitedCols.forEach(c => { obj[c] = r[c] != null ? String(r[c]) : ''; });
        if (r.id || r._id || r.rowId) obj.__rowId = r.id || r._id || r.rowId; return obj;
      }
      return { value: String(r) };
    });
    setTableRows(mapped.length ? mapped : [{ [limitedCols[0] || 'field']: '' }]);
    originalRowsRef.current = mapped;
    seededRef.current = true;
    try { setRowDataDraft(JSON.stringify(mapped.map(r => { const cp = { ...r }; delete cp.__rowId; return cp; }), null, 2)); } catch {}
  };

  useEffect(() => {
    if (!seededRef.current && previewData && !previewData.error) seedFromPreview(previewData);
  }, [previewData]);

  const handleSave = async () => {
    if (!existingSource) return;
    setSavingEdit(true); setEditError(null);
    let edits = [];
    try {
      if (useTableMode) {
        tableRows.forEach((row, idx) => {
          const obj = {}; tableColumns.forEach(c => { if (row[c] != null && row[c] !== '') obj[c] = row[c]; });
          if (!Object.keys(obj).length) return;
          const orig = originalRowsRef.current[idx];
          if (orig && orig.__rowId) {
            let changed = false; tableColumns.forEach(c => { if ((orig[c] || '') !== (row[c] || '')) changed = true; });
            if (changed) edits.push({ action: 'update', rowId: orig.__rowId, changes: obj, persistent });
          } else if (orig) {
            let differs = false; tableColumns.forEach(c => { if ((orig[c] || '') !== (row[c] || '')) differs = true; });
            if (differs) edits.push({ action: 'add', data: obj, persistent });
          } else {
            edits.push({ action: 'add', data: obj, persistent });
          }
        });
      } else {
        let parsed = JSON.parse(rowDataDraft);
        if (Array.isArray(parsed)) {
          if (!parsed.every(o => o && typeof o === 'object' && !Array.isArray(o))) throw new Error('All array items must be plain objects');
          edits = parsed.map(o => ({ action: 'add', data: o, persistent }));
        } else if (parsed && typeof parsed === 'object') {
          edits = [{ action: 'add', data: parsed, persistent }];
        } else throw new Error('Root must be object or array of objects');
      }
      if (!edits.length) throw new Error('No changes to save');
      if (!persistent) {
        const n = Number(ttlSeconds); if (Number.isFinite(n) && n > 0) edits.forEach(e => { if (!e.persistent) e.ttlSeconds = Math.floor(n); });
      }
      await dataSourceService.applyDataEdits(resolvedSourceId(), { edits });
      await handleViewData();
    } catch (e) {
      setEditError(e.message || 'Save failed');
    } finally { setSavingEdit(false); }
  };

  const renderPreview = () => {
    if (!previewData) return null;
    if (previewData.error) return <Text style={{ color: theme.colors.error }}>{previewData.error}</Text>;
    const rows = Array.isArray(previewData.data) ? previewData.data : [];
    const headers = previewData.headers?.length ? previewData.headers : (rows[0] ? Object.keys(rows[0]) : []);
    const toDisplay = rows.slice(0, showAllRows ? 100 : 25);
    return (
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text variant="labelLarge">Rows: {rows.length} • Columns: {headers.length} • Showing {toDisplay.length}</Text>
          {rows.length > 25 && (
            <Button mode="text" onPress={() => setShowAllRows(v => !v)}>{showAllRows ? 'Show 25' : 'Show 100'}</Button>
          )}
        </View>
        <ScrollView horizontal>
          <DataTable>
            <DataTable.Header>
              {headers.map(h => <DataTable.Title key={h} style={{ minWidth: 140 }}><Text style={{ fontWeight: '700' }}>{h}</Text></DataTable.Title>)}
            </DataTable.Header>
            {toDisplay.map((row, ri) => (
              <DataTable.Row key={ri}>
                {headers.map(h => (
                  <DataTable.Cell key={h} style={{ minWidth: 140 }}>
                    <Text>{row && typeof row === 'object' ? String(row[h] ?? '') : String(row)}</Text>
                  </DataTable.Cell>
                ))}
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      </View>
    );
  };

  if (loadingSource) {
    return (
      <View style={[commonStyles.screen, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!existingSource) {
    return (
      <View style={commonStyles.screen}>
        <Header title="Full Data Editor" showBack />
        <View style={styles.center}><Text>Data source not found.</Text></View>
      </View>
    );
  }

  const adapterInfo = getAdapterInfo(existingSource.type);
  const createdAtValue = existingSource?.createdAt || existingSource?.lastSync || null;
  const createdAtText = createdAtValue ? (() => { try { return new Date(createdAtValue).toLocaleString(); } catch { return String(createdAtValue); } })() : null;

  return (
    <View style={commonStyles.screen}>
      <Header title="Full Data Editor" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Card style={{ marginBottom: 16 }}>
          <Card.Title title={existingSource.name || 'Data Source'} subtitle={adapterInfo?.description || existingSource.type} />
          <Card.Content>
            <Text>Created: {createdAtText || 'Unknown'}</Text>
            <Text>Status: {String(existingSource.status)}</Text>
            <Text style={{ marginBottom: 8 }}>Type: {String(existingSource.type)}</Text>
            <Button mode="contained" onPress={handleViewData} loading={previewLoading} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>Refresh Preview</Button>
            {renderPreview()}
          </Card.Content>
        </Card>
        <Card>
          <Card.Title title="Edit Data" right={() => (
            <Button compact mode="text" onPress={() => setUseTableMode(v => {
              if (v) {
                const arr = tableRows.map(r => { const cp = { ...r }; delete cp.__rowId; return cp; });
                try { setRowDataDraft(JSON.stringify(arr, null, 2)); } catch {}
              }
              return !v;
            })}>{useTableMode ? 'Use JSON' : 'Use Table'}</Button>
          )} />
          <Card.Content>
            {useTableMode ? (
              <View style={{ borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: 6, padding: 6, marginBottom: 12 }}>
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
                              style={{ width: 140, backgroundColor: 'transparent' }}
                            />
                            <IconButton icon="minus" size={16} onPress={() => {
                              if (tableColumns.length === 1) return;
                              setTableColumns(prev => prev.filter((_, idx) => idx !== ci));
                              setTableRows(prev => prev.map(r => { const nr = { ...r }; delete nr[col]; return nr; }));
                            }} />
                          </View>
                        ))}
                      </View>
                      <Button compact mode="text" onPress={() => {
                        let base = 'col'; let i = 1; while (tableColumns.includes(base + i)) i++;
                        setTableColumns(prev => [...prev, base + i]);
                        setTableRows(prev => prev.map(r => ({ ...r, [base + i]: '' })));
                      }}>Add Column</Button>
                    </View>
                    {tableRows.map((row, ri) => (
                      <View key={ri} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {tableColumns.map((col, ci) => (
                          <TextInput
                            key={col + ci}
                            mode="outlined"
                            value={row[col] != null ? String(row[col]) : ''}
                            onChangeText={(val) => setTableRows(prev => prev.map((r, idx) => idx === ri ? { ...r, [col]: val } : r))}
                            style={{ width: 140, margin: 2 }}
                          />
                        ))}
                        <IconButton icon="minus" size={16} onPress={() => {
                          if (tableRows.length === 1) return;
                          setTableRows(prev => prev.filter((_, idx) => idx !== ri));
                        }} />
                      </View>
                    ))}
                    <Button compact mode="text" onPress={() => setTableRows(prev => [...prev, Object.fromEntries(tableColumns.map(c => [c, '']))])}>Add Row</Button>
                  </View>
                </ScrollView>
              </View>
            ) : (
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={14}
                value={rowDataDraft}
                onChangeText={setRowDataDraft}
                style={{ maxHeight: 320, marginBottom: 12 }}
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
              {persistent ? 'Changes will be stored permanently.' : 'Changes expire after TTL or next refresh.'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Button onPress={() => router.back()} style={{ marginRight: 8, marginBottom: 8 }}>Close</Button>
              <Button onPress={handleSave} loading={savingEdit} disabled={savingEdit} mode="contained" style={{ marginBottom: 8 }}>Save</Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

export default FullEditData;

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
});
