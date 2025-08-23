import { View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";

const BoardManagement = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Boards" showBack showPlus />
        </View>
    )
}

export default BoardManagement;