// Author(s): Rhys Cleary

import { ActivityIndicator, StyleSheet, View } from "react-native";
import Header from "../components/layout/Header";
import { commonStyles } from "../assets/styles/stylesheets/common";
import { router } from "expo-router";
import { useState } from "react";
import BasicButton from "../components/common/buttons/BasicButton";
import TextField from "../components/common/input/TextField";
import StackLayout from "../components/layout/StackLayout";

const WorkspaceDetails = () => {

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);


    return (
        <View style={commonStyles.screen}>
            <Header title="Workspace Details" showBack />

            <View>
                {loading ? (
                    <View>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <View>
                        <StackLayout spacing={20}> 
                            <TextField label="Name" value={name} placeholder="Name" onChangeText={setName} />
                            <TextField label="Location (Optional)" value={name} placeholder="Location" onChangeText={setName} />
                            <TextField label="Description (Optional)" value={name} placeholder="Description" onChangeText={setName} />
                        </StackLayout>

                        <View style={commonStyles.inlineButtonContainer}>
                            <BasicButton label="Update" />
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
}

export default WorkspaceDetails;