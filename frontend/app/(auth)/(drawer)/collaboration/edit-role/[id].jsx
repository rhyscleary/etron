import { View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";

const EditRole = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Edit Role" showBack showCheck />
        </View>
    )
}

export default EditRole;