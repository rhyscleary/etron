// Author(s): Matthew Page

import { View, FlatList, Pressable, Text as RNText, Button, StyleSheet } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Portal, Dialog, Text } from "react-native-paper";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";
import { useTheme } from "react-native-paper";
import TextField from "../../../../../../components/common/input/TextField";
import DecisionDialog from "../../../../../../components/overlays/DecisionDialog";
import { createNewReport } from "../../../../../../utils/reportUploader";
import ResponsiveScreen from "../../../../../../components/layout/ResponsiveScreen";

const Reports = () => {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [nameDialogVisible, setNameDialogVisible] = useState(false);
  const [reportName, setReportName] = useState("");
  const theme = useTheme();

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

  // Added fetchReports just like before
  const fetchReports = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const draftsResult = await apiGet(
        endpoints.modules.day_book.reports.drafts.getDrafts(workspaceId)
      );
      const result = draftsResult.data;
      setReports(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Run fetchReports on mount + whenever workspaceId changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Report creation logic (moved from report-management)
  const handleReportCreation = async () => {
    if (!reportName.trim()) return;

    try {
      const newDraftId = await createNewReport({
        workspaceId,
        reportName,
      });

      if (newDraftId) {
        setNameDialogVisible(false);

        // Refresh reports list immediately after creation
        await fetchReports();

        // Navigate straight to edit-report page for the created draft
        router.push(`/modules/day-book/reports/edit-report/${newDraftId}`);
      }
    } catch (err) {
      console.error("Error creating report:", err);
    }
  };

  return (

    <ResponsiveScreen
      header={<Header title="Reports" showBack showPlus onRightIconPress={() => setDialogVisible(true)} />}
      scroll={false} padded={false} center={false}
    >

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


      {/* New/Existing Choice Dialog */}
      <DecisionDialog
        visible={dialogVisible}
        title="Would you like to use a template?"
        message="Create a new report or use an existing template."
        showGoBack={true}
        leftActionLabel="New"
        handleLeftAction={() => {
          setDialogVisible(false);
          setNameDialogVisible(true);
        }}
        rightActionLabel="Existing"
        handleRightAction={() => {
          setDialogVisible(false);
          router.navigate("/modules/day-book/reports/templates");
        }}
        handleGoBack={() => {
          setDialogVisible(false);
        }}
      />

      {/* Report Name Dialog */}
      <Portal>
        <Dialog visible={nameDialogVisible} onDismiss={() => setNameDialogVisible(false)}>
          <Dialog.Title>Name Your Report</Dialog.Title>
          <Dialog.Content>
            <TextField
              label="Report Name"
              value={reportName}
              onChangeText={setReportName}
              placeholder="Enter report name"
            />
          </Dialog.Content>
          <Dialog.Actions style={styles.centerActionsRow}>
            <Button title="Cancel" onPress={() => setNameDialogVisible(false)} />
            <Button title="Confirm" onPress={handleReportCreation} />
          </Dialog.Actions>
        </Dialog>
      </Portal>


    </ResponsiveScreen>
  );
};

const styles = StyleSheet.create({
  centerActionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 10,
  },
});

export default Reports;