// Author(s): Matthew Page

import { View, ScrollView, Button, StyleSheet } from "react-native";
import Header from "../../../../../../components/layout/Header";
import DecisionDialog from "../../../../../../components/overlays/DecisionDialog";
import TextField from "../../../../../../components/common/input/TextField";

import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import StackLayout from "../../../../../../components/layout/StackLayout";
import DescriptiveButton from "../../../../../../components/common/buttons/DescriptiveButton";
import { Portal, Dialog, Text } from "react-native-paper";
import React, {useState, useEffect} from "react";
import { apiGet, apiPost } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import { createNewReport } from "../../../../../../utils/reportUploader";




const ReportManagement = () => {
    const [dialogVisible, setDialogVisible] = useState(false);
    const [nameDialogVisible, setNameDialogVisible] = useState(false);
    const [reportName, setReportName] = useState("");
    const [workspaceId, setWorkspaceId] = useState(null);

    useEffect(() => {
    const fetchWorkspace = async () => {
        try {
        const id = await getWorkspaceId();
        if (id) {
            setWorkspaceId(id);
        } else {
            console.error("No workspace ID found");
        }
        } catch (err) {
        console.error("Error fetching workspace ID:", err);
        }
    };
    fetchWorkspace();
    }, []);


    const showDialog = () => setDialogVisible(true);
    const hideDialog = () => setDialogVisible(false);

const handleReportCreation = async () => {
  if (!reportName.trim()) return;

  try {
    const newDraftId = await createNewReport({
        workspaceId,
        reportName
    });

    if (newDraftId) {
      setNameDialogVisible(false);
      // Navigate straight to edit-report page for the created draft
      router.push(`/modules/day-book/reports/edit-report/${newDraftId}`);
    }
  } catch (err) {
    console.error("Error creating report:", err);
  }
};

    


    const settingOptionButtons = [
        { icon: "", label: "Export Metric", description: "Export selected metrics as an image", onPress: () => router.navigate("/modules/day-book/metrics/metric-management") },
        { icon: "", label: "Generate Report", description: "Generate a report from numerous KPIs with written text", onPress: showDialog },
        { icon: "", label: "View Reports", description: "View all past reports (up to 1 year prior) with the option to export", onPress: () => router.navigate("/modules/day-book/reports/reports") },
        { icon: "", label: "View Past Exports", description: "View all past exported reports and metrics (up to 1 year prior)", onPress: () => router.navigate("/modules/day-book/reports/exports") },
        { icon: "", label: "View Report Template", description: "View and edit all created templates", onPress: () => router.navigate("/modules/day-book/reports/templates") },
    ];

    return (
        <View style={commonStyles.screen}>
            <Header title="Reports" showMenu />

            {/* Temporary back button */}
            <Button
                title="Temporary - Back to Dashboard"
                onPress={() => router.navigate("/profile")}
            />

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
                    {settingOptionButtons.map((item) => (
                        <DescriptiveButton
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={item.onPress}
                        />
                    ))}
                </StackLayout>
            </ScrollView>

            {/* New/Existing Choice Dialog */}
            <DecisionDialog
                visible={dialogVisible}
                title="Would you like to use a template?"
                message="Create a new report or use an existing template."
                showGoBack={true}
                leftActionLabel="New"
                handleLeftAction={() => {
                    hideDialog();
                    setNameDialogVisible(true);
                }}
                rightActionLabel="Existing"
                handleRightAction={() => {
                    hideDialog();
                    router.navigate("/modules/day-book/reports/templates");
                }}
                handleGoBack={() => {
                    hideDialog();
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
        </View>
    );
};

const styles = StyleSheet.create({
    centerActionsRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 10,
    },
});

export default ReportManagement;