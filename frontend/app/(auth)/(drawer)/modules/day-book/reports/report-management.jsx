// Author(s): Matthew Page

import { View, ScrollView, Button, StyleSheet } from "react-native";
import Header from "../../../../../../components/layout/Header";

import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import StackLayout from "../../../../../../components/layout/StackLayout";
import DescriptiveButton from "../../../../../../components/common/buttons/DescriptiveButton";
import React, {useState, useEffect} from "react";
import { getWorkspaceId } from "../../../../../../storage/workspaceStorage";
import { useTheme } from "react-native-paper";




const ReportManagement = () => {
    const [workspaceId, setWorkspaceId] = useState(null);
    const theme = useTheme();

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
   


    const settingOptionButtons = [
        { icon: "", label: "Export Metric", description: "Export selected metrics as an image", onPress: () => router.navigate("/modules/day-book/metrics/metric-management") },
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

            <ScrollView style={{backgroundColor: theme.colors.background}} contentContainerStyle={commonStyles.scrollableContentContainer}>
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