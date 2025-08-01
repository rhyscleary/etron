import { View } from "react-native";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import { ScrollView } from "react-native";
import StackLayout from "../../../../../../components/layout/StackLayout";
import Divider from "../../../../../../components/layout/Divider"
import { useTheme, Text } from "react-native-paper";
import { router, Stack } from "expo-router";
import DescriptiveButton from "../../../../../../components/common/buttons/DescriptiveButton";


const CreateDataConnection = () => {
    const theme = useTheme();

    const sourceTypes = [
        { heading: "Spreadsheets", type: [
            { label: "Google Sheets", icon: "google-spreadsheet", onPress: () => router.push("/modules/day-book/data-management/data-connection-inputs/google-sheets") },
            { label: "Excel", icon: "microsoft-excel", onPress: () => router.push("/modules/day-book/data-management/data-connection-inputs/excel") },
        ]},
        { heading: "Custom APIs", type: [
            { label: "Custom API", icon: "web", onPress: () => router.push("/modules/day-book/data-management/data-connection-inputs/custom-API") },
            { label: "Custom FTP", icon: "file-upload", onPress: () => router.push("/modules/day-book/data-management/data-connection-inputs/custom-FTP") },
        ]},
        { heading: "Databases", type: [
            { label: "SQL", icon: "database", onPress: () => router.push("/modules/day-book/data-management/data-connection-inputs/SQL") },
        ]},
    ]

    return (
        <View style={commonStyles.screen}>
            <Header title="New Connection" showBack />
            <ScrollView contentContainerStyle={commonStyles}>
                <StackLayout spacing={12}>
                    {sourceTypes.map((category, index) => (
                        <StackLayout spacing={20} key={category.heading}>
                            <StackLayout spacing={5}>
                                <Text style={commonStyles.titleText}>{category.heading}</Text>
                                {category.type.map((source) => (
                                    <StackLayout spacing={5} key={source.label}>
                                        <DescriptiveButton 
                                            label={source.label}
                                            icon={source.icon}
                                            onPress={source.onPress}
                                            boldLabel={false}
                                        />
                                    </StackLayout>
                                ))}
                            </StackLayout>
                            {index < sourceTypes.length - 1 && (
                                <Divider color={theme.colors.divider}/>
                            )}
                        </StackLayout>
                    ))}
                </StackLayout>
             </ScrollView>

        </View>
    )
}

export default CreateDataConnection;