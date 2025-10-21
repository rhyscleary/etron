// Author(s): Matthew Page

import { useEffect, useState, useCallback } from "react";
import { View, FlatList, Pressable, Text as RNText, Button, StyleSheet, Alert } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import SearchBar from "../../../../../../components/common/input/SearchBar";
import { router } from "expo-router";
import { useTheme, Text } from "react-native-paper";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";

const Templates = () => {
  const [templates, setTemplates] = useState([]);
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

  const fetchTemplates = useCallback(async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      const response = await apiGet(
        endpoints.modules.day_book.reports.templates.getTemplates,
        { workspaceId }
      );
      const templates = response.data;
      setTemplates(Array.isArray(templates) ? templates : []);
    } catch (error) {
      Alert.alert("Error", "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateTestTemplate = async () => {
    if (!workspaceId) return;

    const payload = { workspaceId, name: "Test Template " + Date.now() };
    try {
      await apiPost(endpoints.modules.day_book.reports.templates.createTemplate, payload);
      Alert.alert("Success", "Template created successfully!");
      fetchTemplates();
    } catch (error) {
      Alert.alert("Error", "Could not create template.");
    }
  };

  const handleSearch = (query) => {
    // optional search implementation
  };

  const handleFilterChange = (filter) => {
    // optional filter implementation
  };

  return (
    <View style={[commonStyles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Templates" showBack />

      <View style={{ padding: 16 }}>
        <Button title="Create Test Template" onPress={handleCreateTestTemplate} />
      </View>

      <SearchBar
        placeholder="Search..."
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

    <FlatList
    data={templates}
    keyExtractor={(item) => item.templateId?.toString() || Math.random().toString()}
    contentContainerStyle={{ paddingVertical: 16 }}
    renderItem={({ item }) => (
        <Pressable
        onPress={() =>
            router.push(`/modules/day-book/reports/edit-template/${item.templateId}`)

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
            Loading Templates...
        </RNText>
        ) : (
        <RNText style={{ textAlign: "center", marginTop: 16, color: "#999" }}>
            No templates found
        </RNText>
        )
    }
    />

    </View>
  );
};

export default Templates;
