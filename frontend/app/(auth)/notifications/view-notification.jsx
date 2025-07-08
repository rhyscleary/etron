import { View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";

const ViewNotification = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="notification name here" showBack showEdit />
        </View>
    )
}

export default ViewNotification;