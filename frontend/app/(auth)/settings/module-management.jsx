import { ActivityIndicator, StyleSheet, View } from "react-native";
import Header from "../../../components/layout/Header";
import TextField from "../../../components/common/input/TextField";
import StackLayout from "../../../components/layout/StackLayout";
import BasicButton from "../../../components/common/buttons/BasicButton";
import { Text } from "react-native-paper";
import { commonStyles } from "../../../assets/styles/stylesheets/common";
import { useState } from "react";
import { router, useRouter } from "expo-router";

const ModuleManagement = () => {
    const router = useRouter();
    
    const [loading, setLoading] = useState(false);
    
    return (
        <View style={commonStyles.screen}>
            <Header title="Modules" showBack showPlus onRightIconPress={() => router.push("/settings/add-modules")} />

            <View style={styles.contentContainer}>
                
                
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <View>
                        

                        
                    </View>
                )}
            </View>
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