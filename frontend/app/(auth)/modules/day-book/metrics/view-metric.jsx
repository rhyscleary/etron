import { View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";

const ViewMetric = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="metric name here" showBack showEdit />
        </View>
    )
}

export default ViewMetric;