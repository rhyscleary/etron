import { View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";


const CreateNotification = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Create Notification" showBack showCheck />
        </View>
    )
}

export default CreateNotification;