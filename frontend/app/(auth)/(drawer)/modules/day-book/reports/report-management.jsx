// Author(s): Matthew Page

import { View, ScrollView } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import StackLayout from "../../../../../../components/layout/StackLayout";
import DescriptiveButton from "../../../../../../components/common/buttons/DescriptiveButton";

const ReportManagement = () => {
    const settingOptionButtons = [
        { icon: "", label: "Export Metric", description: "Export selected metrics as an image", onPress: () => router.navigate("/modules/day-book/reports/export-metric") },
        { icon: "", label: "Generate Report", description: "Generate a report form numerous KPIs with written text", onPress: () => router.navigate("/modules/day-book/reports/create-report") },
        { icon: "", label: "View Reports", description: "View all past reports (up to 1 year prior) with the option to export", onPress: () => router.navigate("/modules/day-book/reports/reports") },
        { icon: "", label: "View Past Exports", description: "View all past exported reports and metrics (up to 1 year prior)", onPress: () => router.navigate("/modules/day-book/reports/exports") },
        { icon: "", label: "View Report Template", description: "View and edit all created templates", onPress: () => router.navigate("/modules/day-book/reports/templates") },
    ];


    // Temporary showBack; remove when nav rail is finished
    return (
        <View style={commonStyles.screen}>
            <Header title="Reports" showBack showMenu />

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
        </View>
    );
};

export default ReportManagement;
