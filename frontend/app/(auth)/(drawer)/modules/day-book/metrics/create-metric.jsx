import { View } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";

const CreateMetric = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="New Metric" showBack />
        </View>
    )
}

export default CreateMetric;
