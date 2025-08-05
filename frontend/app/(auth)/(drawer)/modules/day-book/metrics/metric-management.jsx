import { Pressable, View, Button } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text } from "react-native-paper";

const MetricManagement = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Metrics" showMenu showPlus />

            {/*Temporary redirect to profile screen*/}
            <Button title="Temporary - Back to Dashboard" onPress={() => router.back()} />
        </View>
    )
}

export default MetricManagement;