// Author(s): Matthew Page

import { useState, useEffect } from "react";
import { View, Text, Button, FlatList, Alert, ActivityIndicator } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import SearchBar from "../../../../../../components/common/input/SearchBar";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import endpoints from "../../../../../../utils/api/endpoints";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";

const Reports = () => {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch workspace ID from storage
  const fetchWorkspaceId = async () => {
    try {
      const id = await getWorkspaceId();
      setWorkspaceId(id);
    } catch (error) {
      console.error("Error fetching workspace ID:", error);
      Alert.alert("Error", "Failed to fetch workspace ID");
      setLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);

      const result = await apiGet(
        endpoints.modules.day_book.reports.getDrafts(workspaceId)
      );

      setReports(result);
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Error", "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  // Create a test report
  const createTestReport = async () => {
    if (!workspaceId) return;
    try {
      const newReport = await apiPost(
        endpoints.modules.day_book.reports.createDraft,
        {
          workspaceId,
          name: "My Report 1",
        }
      );

      Alert.alert(
        "Success",
        `Report created: ${newReport.draftId || newReport.name || "Unknown"}`
      );

      fetchReports();
    } catch (err) {
      console.error("Create error:", err);
      Alert.alert("Error", err.message);
    }
  };

  useEffect(() => {
    fetchWorkspaceId();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchReports();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <View style={commonStyles.screen}>
        <Header title="Reports" showBack />
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={commonStyles.screen}>
      <Header title="Reports" showBack />

      <SearchBar
        placeholder="Search..."
        onSearch={(q) => console.log("Searching reports for:", q)}
        onFilterChange={(f) => console.log("Reports filter changed to:", f)}
        filterOptions={["All", "Final", "Draft", "Archived"]}
      />

      <Button title="Create Test Report" onPress={createTestReport} />

      <FlatList
        data={reports}
        keyExtractor={(item) => item.draftId.toString()}
        renderItem={({ item }) => (
          <View style={{ margin: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
            <Text>
              Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
            </Text>
            <Text>
              Last Edited: {item.lastEdited ? new Date(item.lastEdited).toLocaleString() : "N/A"}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default Reports;
