import { View, ScrollView } from "react-native";
import { useState } from "react";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import StackLayout from "../../../components/layout/StackLayout";
import DescriptiveButton from "../../../components/common/buttons/DescriptiveButton";
import { useTheme } from "react-native-paper";
import CustomBottomSheet from "../../../components/BottomSheet/bottom-sheet";

const Profile = () => {
    const theme = useTheme();
    const [showSheet, setShowSheet] = useState(false);

    const settingOptionButtons = [

        { icon: "", label: "Settings", onPress: () => router.navigate("/settings/settings")},
        { icon: "", label: "Data Sources", onPress: () => router.navigate("/modules/day-book/data-management/data-management") },
        { icon: "", label: "Metrics", onPress: () => router.navigate("/modules/day-book/metrics/metric-management") },
        { icon: "", label: "Notifications", onPress: () => router.navigate("/modules/day-book/notifications/notifications") },
        { icon: "", label: "Collaboration", onPress: () => router.navigate("/collaboration/collaboration") },
        { icon: "", label: "Testing - Example Graph Display", onPress: () => router.navigate("/graphs") },
        { icon: "", label: "Reports", onPress:() => router.navigate("/modules/day-book/reports/report-management") },
        { icon: "", label: "Testing - Example Bottom Sheet", onPress: () => setShowSheet(true) }, // TODO: get rid of example here
    ];
    
    return (
        <View style={commonStyles.screen}>
            <Header title="Dashboard" showMenu />            
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
            {showSheet && (
                <CustomBottomSheet
                    title="Quick actions"
                    headerActionLabel="Close"
                    onHeaderActionPress={() => setShowSheet(false)}
                    onChange={(index) => {
                        if (index === -1) setShowSheet(false);
                    }}
                    data={settingOptionButtons.filter((b) => b.label !== "Testing - Example Bottom Sheet")}
                    keyExtractor={(item) => item.label}
                    itemTitleExtractor={(item) => item.label}
                    onItemPress={(item) => {
                        setShowSheet(false);
                        if (typeof item.onPress === 'function') item.onPress();
                    }}
                />
            )}
        </View>
    )
}

export default Profile;