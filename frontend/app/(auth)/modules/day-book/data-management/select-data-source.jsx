import { View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";

const SelectDataSource = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="New Connection" showBack />

        </View>
    )
}

export default SelectDataSource;