import { View } from "react-native";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import Header from "../../../../../../components/layout/Header";

const EditMetric = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Edit Metric" showBack showCheck />
        </View>
    )
}

export default EditMetric;