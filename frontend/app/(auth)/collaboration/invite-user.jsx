import { View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { router } from "expo-router";

const InviteUser = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Invite User" showBack showCheck />
        </View>

    )
}

export default InviteUser;