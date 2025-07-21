import { Pressable, View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { Link } from "expo-router";
import { Text } from "react-native-paper";
import { useEffect } from "react";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import Screen from "../../../components/layout/Screen";

const Profile = () => {
    const theme = useTheme();

    return (
        <Screen>
            <Header title="profile name here" showMenu />


            <Pressable onPress={() => router.push("/settings/settings")}>
                <Text>Go to Settings</Text>
            </Pressable>
          

            <Link href="/modules/day-book/data-management/data-management" asChild>
                <Pressable>
                    <Text>Go to Data Sources</Text>
                </Pressable>
            </Link>

            <Link href="/modules/day-book/metrics/metric-management" asChild>
                <Pressable>
                    <Text>Go to Metrics</Text>
                </Pressable>
            </Link>

            <Link href="/modules/day-book/notifications/notifications" asChild>
                <Pressable>
                    <Text>Go to Notifications</Text>
                </Pressable>
            </Link>

            <Link href="/collaboration/collaboration" asChild>
                <Pressable>
                    <Text>Go to Users - Collaboration</Text>
                </Pressable>
            </Link>

            <Link href="/account-settings" asChild>
                <Pressable>
                    <Text>Go to temporary account settings UI</Text>
                </Pressable>
            </Link>
        </Screen>
    )
}

export default Profile;