import { View } from "react-native";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";
import Header from "../../../../components/layout/Header";

const AddUser = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Add User" showBack showCheck />
        </View>
    )
}

export default AddUser;