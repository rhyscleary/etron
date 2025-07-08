import { View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";

const ProfileManagement = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Profiles" showBack showPlus />
        </View>
    )
}

export default ProfileManagement;