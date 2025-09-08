import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator, useTheme, Card } from 'react-native-paper';
import endpoints from '../../../utils/api/endpoints';
import { apiGet } from '../../../utils/api/apiClient.jsx';
import { getWorkspaceId } from '../../../storage/workspaceStorage';

/**
 * Generic button to fetch a Day Book data source by id and display response.
 * Props:
 *  - dataSourceId (required) string (underscored id)
 *  - title optional button label
 *  - params extra query params object
 *  - renderResult optional custom render function (data) => ReactNode
 *  - collapsed if true hides JSON until explicitly expanded (future)
 */
const DataSourceFetchButton = ({
  dataSourceId,
  title = 'Fetch Data Source (API)',
  params = {},
  renderResult,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleFetch = async () => {
    if (!dataSourceId) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const workspaceId = await getWorkspaceId();
      const response = await apiGet(
        endpoints.modules.day_book.data_sources.getDataSource(dataSourceId),
        { workspaceId, ...params }
      );
      setData(response);
    } catch (e) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained-tonal"
        onPress={handleFetch}
        disabled={loading || !dataSourceId}
      >
        {loading ? 'Fetching...' : title}
      </Button>
      {loading && (
        <View style={styles.inline}>
          <ActivityIndicator style={{ marginTop: 8 }} />
        </View>
      )}
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]} selectable>
          Error: {error}
        </Text>
      )}
      {data && (
        <Card mode="outlined" style={[styles.resultCard, { borderColor: theme.colors.outline }]}>
          <Card.Content>
            {renderResult ? (
              renderResult(data)
            ) : (
              <Text selectable style={styles.jsonText}>
                {JSON.stringify(data, null, 2)}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    width: '100%',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
  },
  resultCard: {
    marginTop: 12,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default DataSourceFetchButton;
