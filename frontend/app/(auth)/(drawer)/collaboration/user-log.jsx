import { View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import ResponsiveScreen from "../../../../components/layout/ResponsiveScreen";

const UserLog = () => {
    return (
        <ResponsiveScreen
            header={<Header title="User Log" showBack />}
            center={false}
            padded
            scroll={true}
        >

        </ResponsiveScreen>
    )
}

export default UserLog;