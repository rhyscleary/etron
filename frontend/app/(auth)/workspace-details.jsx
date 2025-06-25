// Author(s): Rhys Cleary

import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import Header from "../../components/layout/Header";
import { commonStyles } from "../../assets/styles/stylesheets/common";
import DescriptiveButton from "../../components/common/buttons/DescriptiveButton";
import { Button, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { useState } from "react";
import BasicButton from "../../components/common/buttons/BasicButton";
import TextField from "../../components/common/input/TextField";



const WorkspaceDetails = () => {
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
                        <View style={styles.textFieldContainer}> 
                            <TextField label="Name" value={name} placeholder="Name" onChangeText={setName} />
                            <TextField label="Location (Optional)" value={name} placeholder="Location" onChangeText={setName} />
                            <TextField label="Description (Optional)" value={name} placeholder="Description" onChangeText={setName} />
                        </View>

                        <View style={styles.buttonContainer}>
                            <BasicButton label="Update" />
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    TextField: {
        marginVertical: 20
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginVertical: 20,
        gap: 32
    }
    
    
})

export default WorkspaceDetails;