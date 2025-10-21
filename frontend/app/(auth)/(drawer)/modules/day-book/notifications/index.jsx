import { Pressable, View, Button } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text } from "react-native-paper";
import ResponsiveScreen from "../../../../../../components/layout/ResponsiveScreen";

const Notifications = () => {
    return (
        <ResponsiveScreen
            header={
                <Header title="Notifications" showMenu showPlus onRightIconPress={() => router.navigate("/modules/day-book/notifications/create-notification")} />
            }
            center={false}
            padded={false}
            scroll={true}
        >
        </ResponsiveScreen>
    )
}

export default Notifications;