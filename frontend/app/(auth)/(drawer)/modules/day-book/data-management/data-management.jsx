import { Pressable, ScrollView, View } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text } from "react-native-paper";
import StackLayout from "../../../../../../components/layout/StackLayout";

const DataManagement = () => {


    return (
        <View style={commonStyles.screen}>
            <Header title="Data Management" showMenu showPlus onRightIconPress={() => router.push("/modules/day-book/data-management/create-data-connection")}/>

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