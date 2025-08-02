import { View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";

const EditUser = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Edit Invite" showBack showCheck />
        </View>
    )
}

export default EditUser;