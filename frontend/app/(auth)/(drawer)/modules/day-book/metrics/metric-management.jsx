import SearchBar from "../../../../../../components/common/input/SearchBar.jsx";
import Divider from "../../../../../../components/layout/Divider.jsx";
import { Pressable, View, Button } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { Link, useRouter } from "expo-router";
import { Text, useTheme } from "react-native-paper";

const MetricManagement = () => {
    const router = useRouter();
    
    const theme = useTheme();

    return (
        <View style={commonStyles.screen}>
            <Header title="Metrics" showMenu showPlus onRightIconPress={() => router.push("/modules/day-book/metrics/create-metric")}/>
            
            <View>
                <SearchBar/>


                <View style={{ paddingHorizontal: 20, gap: 30 }}>
                    <View>
                        <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                            Created by you
                        </Text>
                    </View>

                    <Divider/>

                    <View>
                        <Text style={{ fontSize: 16, color: theme.colors.placeholderText}}>
                            Created by others
                        </Text>
                    </View>
                </View>
            </View>

            {/*Temporary redirect to profile screen*/}
            <Button title="Temporary - Back to Dashboard" onPress={() => router.push("/profile")} />
        </View>
    )
}

export default MetricManagement;