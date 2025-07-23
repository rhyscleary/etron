import { Pressable, View } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link } from "expo-router";
import { Text } from "react-native-paper";


const DataManagement = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Data Management" showMenu showPlus />

            {/*Temporary redirect to profile screen*/}
            <Link href="/profile" asChild>
                <Pressable>
                    <Text>Go to Profile</Text>
                </Pressable>
            </Link>
        </View>
    )
}

export default DataManagement;