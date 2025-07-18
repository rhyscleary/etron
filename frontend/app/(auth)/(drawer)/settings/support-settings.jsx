import { View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";

const SupportSettings = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Support" showBack />
        </View>
    )
}

export default SupportSettings;