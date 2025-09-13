// Author(s): Matthew Page

import { View, ScrollView, Button, StyleSheet } from "react-native";
import Header from "../../../../../../components/layout/Header";
import DecisionDialog from "../../../../../../components/overlays/DecisionDialog";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import StackLayout from "../../../../../../components/layout/StackLayout";
import DescriptiveButton from "../../../../../../components/common/buttons/DescriptiveButton";
import { Portal, Dialog, Text } from "react-native-paper";
import React, { useState } from "react";

const ReportManagement = () => {
    const [dialogVisible, setDialogVisible] = useState(false);

    const showDialog = () => setDialogVisible(true);
    const hideDialog = () => setDialogVisible(false);

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


            {/* Dialog */}
            <DecisionDialog
                visible={dialogVisible} 
                title="Would you like to use a template?"
                message="Create a new report or use an existing template."
                showGoBack={true}
                leftActionLabel="New"
                handleLeftAction={() => {
                    hideDialog();
                    router.navigate("/modules/day-book/reports/create-report");
                }}
                rightActionLabel="Existing"
                handleRightAction={() => {
                    hideDialog();
                    router.navigate("/modules/day-book/reports/templates");
                }}
                handleGoBack={() => {
                    hideDialog(); // closes the modal
                }}
            />



        </View>
    );
};

const styles = StyleSheet.create({
    dialogBox: {
        alignSelf: "center",
        width: 300, // makes it square-ish
        borderRadius: 8,
    },
    centerText: {
        textAlign: "center",
    },
    centerActionsRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 10,
    },
    centerActionsColumn: {
        justifyContent: "center",
        marginTop: 10,
    },
    buttonWrapper: {
        flex: 1,
        marginHorizontal: 5,
    },
    singleButtonWrapper: {
        width: "50%", // adjust width to match row buttons
        alignSelf: "center",
    },
});

export default ReportManagement;
