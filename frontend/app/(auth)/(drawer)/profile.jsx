import { Pressable, View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { Link } from "expo-router";
import { Text } from "react-native-paper";
import { useEffect } from "react";

const Profile = () => {

    return (
        <View style={commonStyles.screen}>
            <Header title="profile name here" showMenu />


            <Link href="/settings/settings" asChild>
                <Pressable>
                    <Text>Go to Settings</Text>
                </Pressable>
            </Link>

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
                    <Text>Go to Collaboration</Text>
                </Pressable>
            </Link>

            <Link href="/account-settings" asChild>
                <Pressable>
                    <Text>Go to temporary account settings UI</Text>
                </Pressable>
            </Link>

            <Link href="/graphs" asChild>
                <Pressable>
                    <Text>Go to Graphs</Text>
                </Pressable>
            </Link>
        </View>
    )
}

export default Profile;