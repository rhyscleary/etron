// Author(s): Matthew Page

import { View, Text } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";

const CreateReport = () => {

    return (
        <View style={commonStyles.screen}>
            <Header title="Structure Report" showBack />

        </View>
        // This is the hard part D; How do I create a dynamic list or object that can then be exported as it looks in the app to a pdf...
    );
};

export default CreateReport;
