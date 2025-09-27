// Author(s): Matthew Page

import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Button, Alert } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import SearchBar from "../../../../../../components/common/input/SearchBar";
import endpoints from "../../../../../../utils/api/endpoints";
import { router } from "expo-router";
import { useTheme } from "react-native-paper";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";
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

  const fetchTemplates = async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      const data = await apiGet(
        endpoints.modules.day_book.reports.templates.getTemplates,
        { workspaceId } // query params
      );
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchTemplates();
    }
  }, [workspaceId]);

  const handleCreateTestTemplate = async () => {
    if (!workspaceId) return;

    const payload = {
      workspaceId,
      name: "Test Template " + Date.now(),
    };

    try {
      await apiPost(
        endpoints.modules.day_book.reports.templates.createTemplate,
        payload
      );

      Alert.alert("Success", "Template created successfully!");
      fetchTemplates(); // refresh list
    } catch (error) {
      Alert.alert("Error", "Could not create template.");
    }
  };

  const handleSearch = (query) => {
    // Implement search functionality if needed
  };

  const handleFilterChange = (filter) => {
    // Implement filter functionality if needed
  };

  return (
    <View style={[commonStyles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Templates" showBack />

      {/* Button to create a new template */}
      <View style={{ padding: 16 }}>
        <Button title="Create Test Template" onPress={handleCreateTestTemplate} />
      </View>

      <SearchBar
        placeholder="Search..."
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#ccc" }}
              onPress={() => router.push(`/templates/${item.id}`)}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
              No templates found
            </Text>
          }
        />
      )}
    </View>
  );
};

export default Templates;
