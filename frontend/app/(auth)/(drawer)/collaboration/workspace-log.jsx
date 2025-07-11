import { View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";

const WorkspaceLog = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Workspace Log" showBack />
        </View>
    )
}

export default WorkspaceLog;