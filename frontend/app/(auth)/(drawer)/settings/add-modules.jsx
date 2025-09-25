// Author(s): Rhys Cleary

import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text } from "react-native-paper";
import { useState } from "react";
import { router } from "expo-router";
import ModuleCard from "../../../../components/cards/moduleCard";
import BasicDialog from "../../../../components/overlays/BasicDialog";

const AddModules = () => {
    
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [installDialogVisible, setInstallDialogVisible] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);

    const modules = [
        {   
            moduleId: "123",
            title: "Leave",
            description: "Let employees request leave and review the information",
            icon: "book",
            keywords: ["report", "insights"]
        },
        {
            moduleId: "1234",
            title: "",
            description: "",
            icon: "",
            keywords: []
        },
        {
            moduleId: "12345",
            title: "",
            description: "",
            icon: "",
            keywords: []
        },
        {
            moduleId: "1234544",
            title: "",
            description: "",
            icon: "",
            keywords: []
        },
        {
            moduleId: "123rttg45",
            title: "",
            description: "",
            icon: "",
            keywords: []
        },
    ]

    const renderModules = ({item}) => (
        <ModuleCard
            title={item.title}
            description={item.description}
            icon={item.icon}
            onPress={() => {
                setSelectedModule(item);
                setInstallDialogVisible(true);
                
                console.log(item.moduleId);
            }}
        />
    );

    const handleModuleInstallation = () => {

    };
    
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
                        keyExtractor={item => item.moduleId}
                        ItemSeparatorComponent={() => <View style={{height: 12}} />}
                    />
                )}
            </View>
            
            <BasicDialog
                visible={installDialogVisible}
                message={`Install the ${selectedModule?.title || "selected"} module?`}
                leftActionLabel="Cancel"
                handleLeftAction={() => {
                    setInstallDialogVisible(false);
                    setSelectedModule(null);
                }}
                rightActionLabel="Install"
                handleRightAction={handleModuleInstallation}
            />
        </View>
    )
};

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

export default AddModules;