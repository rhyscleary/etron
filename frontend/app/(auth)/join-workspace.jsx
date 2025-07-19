import { View } from "react-native";
import { PaperProvider, Text } from 'react-native-paper';
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";

const JoinWorkspace = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Join Workspace" showBack />

            <Text style={{ fontSize: 16 }}>
              You have the following options:
            </Text>
        </View>
    )

}

export default JoinWorkspace;