// Author(s): Matthew Page

import { View, FlatList, Pressable, Text as RNText, Button } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";

const Reports = () => {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch workspace ID
  useEffect(() => {
    const fetchWorkspaceId = async () => {
      try {
        const id = await getWorkspaceId();
        setWorkspaceId(id);
      } catch (error) {
        console.error("Error fetching workspace ID:", error);
      }
    };
    fetchWorkspaceId();
  }, []);

  const fetchReports = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const result = await apiGet(
        endpoints.modules.day_book.reports.drafts.getDrafts(workspaceId)
      );
      setReports(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Run fetch on mount + whenever workspaceId changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Create test report
  const createTestReport = async () => {
    if (!workspaceId) return;
    try {
      const newReport = await apiPost(
        endpoints.modules.day_book.reports.drafts.createDraft,
        {
          workspaceId,
          name: "My Report 122",
        }
      );
      console.log("Created report:", newReport);

      // Refreshes list immediately after creation
      await fetchReports();
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };

  return (
    <View style={commonStyles.screen}>
      <Header title="Reports" showBack />

      {/* Temporary test button */}
      <View style={{ margin: 12 }}>
        <Button title="Create Test Report" onPress={createTestReport} />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.draftId}
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.navigate(`/modules/day-book/reports/edit-report/${item.draftId}`)
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
              Created:{" "}
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "N/A"}
            </RNText>
            <RNText style={{ fontSize: 12, color: "#666" }}>
              Last Edited:{" "}
              {item.lastEdited
                ? new Date(item.lastEdited).toLocaleString()
                : "N/A"}
            </RNText>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <RNText style={{ textAlign: "center", marginTop: 16, color: "#999" }}>
              Loading Reports...
            </RNText>
          ) : (
            <RNText style={{ textAlign: "center", marginTop: 16, color: "#999" }}>
              No reports found
            </RNText>
          )
        }
      />
    </View>
  );
};

export default Reports;
