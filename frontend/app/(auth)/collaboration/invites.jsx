import { View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { router } from "expo-router";

const Invites = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Invites" showBack showPlus onRightIconPress={() => router.push("/collaboration/invite-user")} />
        </View>
    )
}

export default Invites;