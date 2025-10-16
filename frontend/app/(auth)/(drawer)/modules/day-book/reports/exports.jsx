// Author(s): Matthew Page

import { useEffect, useState, useCallback } from "react";
import { View, FlatList, Pressable, Text as RNText, Button, Alert, Linking } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import SearchBar from "../../../../../../components/common/input/SearchBar";
import { useTheme, Text } from "react-native-paper";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import * as FileSystem from 'expo-file-system';
import { openFileAsync } from 'expo-file-viewer';
import * as WebBrowser from 'expo-web-browser';

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
      console.log("[Exports] Fetching exports for workspace:", workspaceId);

      const url = `${endpoints.modules.day_book.reports.exports.getExports}?workspaceId=${encodeURIComponent(workspaceId)}`;
      const response = await apiGet(url);

      const exportsData = Array.isArray(response)
        ? response
        : Array.isArray(response.data)
        ? response.data
        : response.data?.exports || [];

      console.log("[Exports] Received", exportsData.length, "exports");
      setExportsList(exportsData);
    } catch (error) {
      console.error("[Exports] Failed to load exports:", error);
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
      await apiPost(endpoints.modules.day_book.reports.exports.addExport, payload);
      Alert.alert("Success", "Export created successfully!");
      fetchExports();
    } catch (error) {
      Alert.alert("Error", "Could not create export.");
    }
  };

  // Handle PDF download
  const handleOpenExport = async (item) => {
    try {
      console.log("[Exports] Requesting signed download URL for:", item.exportId);

      // Call the backend endpoint to get a signed URL
      const endpoint = endpoints.modules.day_book.reports.exports.getExportDownloadUrl(item.exportId);
      const response = await apiGet(endpoint, {workspaceId});

      const signedUrl =
        response?.data?.fileUrl ||
        response?.data?.url ||
        response?.data?.downloadUrl;
      console.log("Signed URL from server:", signedUrl);


      if (!signedUrl) {
        console.error("[Exports] No signed URL returned by server:", response);
        Alert.alert("Error", "No download link available for this export.");
        return;
      }

      // Download the PDF file locally
      const fileUri = FileSystem.cacheDirectory + `${item.name}.pdf`;
      const { uri } = await FileSystem.downloadAsync(signedUrl, fileUri);
      console.log("[Exports] File saved to:", uri);

      console.log("[Exports] Opening signed URL:", signedUrl);
      await WebBrowser.openBrowserAsync(signedUrl);
      //await Linking.openURL(uri);
    } catch (error) {
      console.error("[Exports] Error opening export:", error);
      Alert.alert("Error", "Could not open export file.");
    }
  };

  const handleSearch = (query) => {};
  const handleFilterChange = (filter) => {};

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
            onPress={() => handleOpenExport(item)}
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
