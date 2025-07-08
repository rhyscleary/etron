import { View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";

const ThemeSettings = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Themes" showBack />
        </View>
    )
}

export default ThemeSettings;