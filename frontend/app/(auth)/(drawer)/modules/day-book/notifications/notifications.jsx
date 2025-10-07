import { Pressable, View, Button } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text } from "react-native-paper";

const Notifications = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Notifications" showMenu showPlus onRightIconPress={() => router.navigate("/notifications/create-notification")} />

            {/*Temporary redirect to profile screen*/}
            <Button title="Temporary - Back to Dashboard" onPress={() => router.navigate("/dashboard")} />
        </View>
    )
}

export default Notifications;