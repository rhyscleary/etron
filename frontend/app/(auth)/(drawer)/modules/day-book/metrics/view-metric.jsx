import { View } from "react-native";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import Header from "../../../../../../components/layout/Header";

const ViewMetric = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="metric name here" showBack showEdit />
        </View>
    )
}

export default ViewMetric;