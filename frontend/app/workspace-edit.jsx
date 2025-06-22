// Author(s): Rhys Cleary

import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import Header from "../components/layout/Header";
import { commonStyles } from "../assets/styles/stylesheets/common";
import DescriptiveButton from "../components/common/buttons/DescriptiveButton";
import { Button, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { TextField } from "../components/common/input/TextField";
import { useState } from "react";
import BasicButton from "../components/common/buttons/Button";


//<TextField label="" value={name} placeholder="" />


const WorkspaceEdit = () => {
    const theme = useTheme();

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);


    return (
        <View>
            <Header title="Workspace Details" showBack />

            <View>
                {loading ? (
                    <View>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <View>
                        

                        <View style={styles.test}>
                            <BasicButton label="Update" danger />
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    test: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 12
        
    },
    button: {
        borderRadius: 10,
        width: 145
    }
    
})

export default WorkspaceEdit;