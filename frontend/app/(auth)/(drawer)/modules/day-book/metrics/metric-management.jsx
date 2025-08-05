import { Pressable, View } from "react-native";
import Header from "../../../../../../components/layout/Header.jsx";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common.js";
import { Link, useRouter } from "expo-router";
import { Text, useTheme } from "react-native-paper";
import SearchBar from "../../../../../../components/common/input/SearchBar.jsx";
import Divider from "../../../../../../components/layout/Divider.jsx";

const MetricManagement = () => {
    const router = useRouter();
    
    const theme = useTheme();

    return (
        <View style={commonStyles.screen}>
            <Header title="Metrics" showMenu showPlus onRightIconPress={() => router.push("/create-metric")}/>
            
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
        </View>
    )
}

export default MetricManagement;