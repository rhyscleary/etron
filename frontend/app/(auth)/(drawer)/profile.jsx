import { Pressable, View } from "react-native";
import { Link, router } from "expo-router";
import { Text, useTheme } from "react-native-paper";
import { saveTestWorkspaceInfo } from "../../../storage/workspaceStorage";
import { useEffect } from "react";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import Screen from "../../../components/layout/Screen";

const Profile = () => {
    const theme = useTheme();

    useEffect(() => {
        saveTestWorkspaceInfo();
    }, []);

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

            <Link href="/notifications/notifications" asChild>
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