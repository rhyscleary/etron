import { View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";

const AccessibilitySettings = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Accessibility" showBack />
        </View>
    )
}

export default AccessibilitySettings;