import { View } from "react-native";
import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";

const EditMetric = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Edit Metric" showBack showCheck />
        </View>
    )
}

export default EditMetric;