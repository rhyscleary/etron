import { View } from "react-native";
<<<<<<<< HEAD:frontend/app/(auth)/(drawer)/notifications/create-notification.jsx
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
========
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
>>>>>>>> develop:frontend/app/(auth)/(drawer)/modules/day-book/notifications/create-notification.jsx


const CreateNotification = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Create Notification" showBack showCheck />
        </View>
    )
}

export default CreateNotification;