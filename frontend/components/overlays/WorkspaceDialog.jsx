// Author(s): Rhys Cleary

import { Dialog, Portal, Text, useTheme } from "react-native-paper";
import BasicButton from "../common/buttons/BasicButton";
import { StyleSheet, TouchableOpacity, View } from "react-native";


const WorkspaceDialog = ({
    visible,
    onDismiss,
    setWorkspaceModal,
    router,
    showGoBack = false
}) => {
    const theme = useTheme();

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, {backgroundColor: theme.colors.surface}]}>
                <Dialog.Title style={styles.title}>Workspace</Dialog.Title>

                <Dialog.Content>
                    <Text style={styles.message}>
                        Create your own workspace or join an existing one.
                    </Text>
                </Dialog.Content>

                <Dialog.Actions style={styles.actions}>
                    <BasicButton 
                        label="Create" 
                        onPress={() => {
                            setWorkspaceModal(false);
                            router.navigate("/(auth)/create-workspace");
                        }}
                    />
                    <BasicButton 
                        label="Join" 
                        onPress={() => {
                            setWorkspaceModal(false);
                            router.navigate("/(auth)/join-workspace");
                        }}
                    />
                </Dialog.Actions>

                {showGoBack && (
                    <View style={styles.goBackContainer}>
                        <TouchableOpacity onPress={() => setWorkspaceModal(false)}>
                            <Text>Go back</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 10
    },
    inputContainer: {
        marginTop: 20
    },
    title: {
        textAlign: "center"
    },
    message: {
        fontSize: 16,
        textAlign: "center",
    },
    actions: {
        justifyContent: "space-between"
    },
    goBackContainer: {
        alignItems: "center",
        marginBottom: 20
    }
})

export default WorkspaceDialog;