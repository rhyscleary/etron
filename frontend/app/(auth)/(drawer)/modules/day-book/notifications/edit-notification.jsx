import { View } from "react-native";
<<<<<<<< HEAD:frontend/app/(auth)/(drawer)/notifications/edit-notification.jsx
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
========
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
>>>>>>>> develop:frontend/app/(auth)/(drawer)/modules/day-book/notifications/edit-notification.jsx

const EditNotification = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Edit Notification" showBack showCheck />
        </View>
    )
}

export default EditNotification;