import { View } from "react-native";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { ScrollView } from "react-native";
import StackLayout from "../../../../../../../components/layout/StackLayout";
import { useTheme, Text } from "react-native-paper";
import { router, Stack } from "expo-router";


const Excel = () => {
    const theme = useTheme();

    return (
        <View style={commonStyles.screen}>
            <Header title="Excel" showBack />
            <ScrollView contentContainerStyle={commonStyles}>
                <StackLayout spacing={12}>
                    
                </StackLayout>
             </ScrollView>

        </View>
    )
}

export default Excel;