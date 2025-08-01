import { View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";

const Roles = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Roles" showBack showPlus onRightIconPress={() => router.push("")} />
        </View>
    )
}

export default Roles;