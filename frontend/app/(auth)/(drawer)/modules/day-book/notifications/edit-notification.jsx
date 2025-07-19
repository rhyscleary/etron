import { View } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";

const EditNotification = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Edit Notification" showBack showCheck />
        </View>
    )
}

export default EditNotification;