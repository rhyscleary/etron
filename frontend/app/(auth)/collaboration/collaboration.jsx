import { Pressable, View } from "react-native";
import Header from "../../../components/layout/Header";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { Link, router } from "expo-router";
import { Text } from "react-native-paper";

const Collaboration = () => {
    return (
        <View style={commonStyles.screen}>
            <Header title="Users" showMenu showPlus onRightIconPress={() => router.push("/collaboration/add-user")} />

            {/*Temporary redirect to profile screen*/}
            <Link href="/profile" asChild>
                <Pressable>
                    <Text>Go to Profile</Text>
                </Pressable>
            </Link>
        </View>
    )
}

export default Collaboration;