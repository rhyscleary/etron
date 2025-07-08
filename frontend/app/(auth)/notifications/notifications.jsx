import { Pressable, View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text } from "react-native-paper";

const Notifications = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Notifications" showMenu showPlus onRightIconPress={() => router.push("/notifications/create-notification")} />

            {/*Temporary redirect to profile screen*/}
            <Link href="/profile" asChild>
                <Pressable>
                    <Text>Go to Profile</Text>
                </Pressable>
            </Link>
        </View>
    )
}

export default Notifications;