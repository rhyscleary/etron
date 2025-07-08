import { View } from "react-native";
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";

const JoinWorkspace = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Join Workspace" showBack />
        </View>
    )
}

export default JoinWorkspace;