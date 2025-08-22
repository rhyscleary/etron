// Author(s): Matthew Page

import { View, ScrollView, Button, StyleSheet } from "react-native";
import Header from "../../../../../../components/layout/Header";
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
            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={hideDialog}
                    style={styles.dialogBox}
                >
                    <Dialog.Title style={styles.centerText}>
                        Would you like to use a template?
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.centerText}>
                            Create a new report or use an existing template
                        </Text>
                    </Dialog.Content>

                    <Dialog.Actions style={styles.centerActionsRow}>
                        <View style={styles.buttonWrapper}>
                            <Button
                                title="New"
                                onPress={() => { hideDialog(); router.navigate("/modules/day-book/reports/create-report"); }}
                            />
                        </View>
                        <View style={styles.buttonWrapper}>
                            <Button
                                title="Existing"
                                onPress={() => { hideDialog(); router.navigate("/modules/day-book/reports/templates"); }}
                            />
                        </View>
                    </Dialog.Actions>

                    {/* Separate row for Go Back */}
                    <Dialog.Actions style={styles.centerActionsColumn}>
                        <View style={styles.singleButtonWrapper}>
                            <Button title="Go Back" onPress={hideDialog} />
                        </View>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
