// Author(s): Matthew Page

import { useEffect, useState, useCallback } from "react";
import { View, FlatList, Pressable, Text as RNText, Button, Alert } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import SearchBar from "../../../../../../components/common/input/SearchBar";
import { router } from "expo-router";
import { useTheme, Text } from "react-native-paper";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";

const Exports = () => {
  const [exportsList, setExportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState(null);
  const theme = useTheme();

  // Fetch workspace ID
  useEffect(() => {
    const fetchWorkspaceId = async () => {
      try {
        const id = await getWorkspaceId();
        setWorkspaceId(id);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch workspace ID.");
      }
    };
    fetchWorkspaceId();
  }, []);

  // Fetch exports
  const fetchExports = useCallback(async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      const data = await apiGet(
        endpoints.modules.day_book.reports.exports.getExports,
        { workspaceId }
      );
      setExportsList(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", "Failed to load exports.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchExports();
  }, [fetchExports]);

  // Create a test export
  const handleCreateTestExport = async () => {
    if (!workspaceId) return;

    const payload = { workspaceId, name: "Test Export " + Date.now() };
    try {
      await apiPost(endpoints.modules.day_book.reports.exports.createExport, payload);
      Alert.alert("Success", "Export created successfully!");
      fetchExports();
    } catch (error) {
      Alert.alert("Error", "Could not create export.");
    }
  };

  const handleSearch = (query) => {
    // optional: implement search filtering
  };

  const handleFilterChange = (filter) => {
    // optional: implement filtering
  };

  return (
    <View style={[commonStyles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Exports" showBack />

      <View style={{ padding: 16 }}>
        <Button title="Create Test Export" onPress={handleCreateTestExport} />
      </View>

      <SearchBar
        placeholder="Search exports..."
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      <FlatList
        data={exportsList}
        keyExtractor={(item) => item.exportId?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push(`/modules/day-book/reports/view-export/${item.exportId}`)
            }
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 4,
              padding: 16,
              marginVertical: 2,
              marginHorizontal: 12,
            }}
          >
            <Text>{item.name}</Text>
            <RNText style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
            </RNText>
            <RNText style={{ fontSize: 12, color: "#666" }}>
              Last Edited: {item.lastEdited ? new Date(item.lastEdited).toLocaleString() : "N/A"}
            </RNText>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <RNText style={{ textAlign: "center", marginTop: 16, color: "#999" }}>
              Loading Exports...
            </RNText>
          ) : (
            <RNText style={{ textAlign: "center", marginTop: 16, color: "#999" }}>
              No exports found
            </RNText>
          )
        }
      />
    </View>
  );
};

export default Exports;
