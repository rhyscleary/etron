import { View } from "react-native";
<<<<<<<< HEAD:frontend/app/(auth)/(drawer)/notifications/view-notification.jsx
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
========
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
>>>>>>>> develop:frontend/app/(auth)/(drawer)/modules/day-book/notifications/view-notification.jsx

const ViewNotification = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="notification name here" showBack showEdit />
        </View>
    )
}

export default ViewNotification;