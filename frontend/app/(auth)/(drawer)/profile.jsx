import { Pressable, View, ScrollView } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text } from "react-native-paper";
import StackLayout from "../../../components/layout/StackLayout";
import DescriptiveButton from "../../../components/common/buttons/DescriptiveButton";

const Profile = () => {
    const settingOptionButtons = [

        { icon: "", label: "Settings", onPress: () => router.navigate("/settings/settings")},
        { icon: "", label: "Data Sources", onPress: () => router.navigate("/modules/day-book/data-management/data-management") },
        { icon: "", label: "Metrics", onPress: () => router.navigate("/modules/day-book/metrics/metric-management") },
        { icon: "", label: "Notifications", onPress: () => router.navigate("/modules/day-book/notifications/notifications") },
        { icon: "", label: "Collaboration", onPress: () => router.navigate("/collaboration/collaboration") },
        { icon: "", label: "Testing - Account Settings", onPress: () => router.navigate("/account-settings") },
        { icon: "", label: "Testing - Example Graph Display", onPress: () => router.navigate("/graphs") },
        { icon: "", label: "Testing - Endpoints", onPress: () => router.navigate("/test-endpoints/endpoints") },
        { icon: "", label: "Testing - Create Workspace", onPress: () => router.navigate("../create-workspace") },
        { icon: "", label: "Testing - Join Workspace", onPress: () => router.navigate("../join-workspace") },

    ];
    
    return (
        <View style={commonStyles.screen}>
            <Header title="Dashboard" showMenu />

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
    )
}

export default Profile;