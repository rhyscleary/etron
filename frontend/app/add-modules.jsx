import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import Header from "../components/layout/Header";
import TextField from "../components/common/input/TextField";
import StackLayout from "../components/layout/StackLayout";
import BasicButton from "../components/common/buttons/BasicButton";
import { Text } from "react-native-paper";
import { commonStyles } from "../assets/styles/stylesheets/common";
import { useState } from "react";
import { router } from "expo-router";
import ModuleCard from "../components/cards/moduleCard";

const ModuleManagement = () => {
    
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const modules = [
        {
            title: "Leave",
            description: "Let employees request leave and review the information",
            icon: "book",
            keywords: ["report", "insights"]
        },
        {
            title: "",
            description: "",
            icon: "",
            keywords: []
        },
        {
            title: "",
            description: "",
            icon: "",
            keywords: []
        },
    ]

    const renderModules = () => (
        <ModuleCard
             
        />
    );
    
    return (
        <View style={commonStyles.screen}>
            <Header title="Add Modules" showBack />
            
            {/*Search bar here*/}

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={modules}
                        renderItem={renderModules}
                        keyExtractor={item => item.id}
                    />
                )}
            </View>

            <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
                <StackLayout spacing={12}>
                    {workspaceOptionButtons.map((item) => (
                        <DescriptiveButton 
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={item.onPress}
                        />
                    ))}
                </StackLayout>

            </ScrollView>

        </View>
    )
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default ModuleManagement;