// Author(s): Rhys Cleary

import { Dialog, Portal, Text, useTheme } from "react-native-paper";
import BasicButton from "../common/buttons/BasicButton";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { signOut } from "aws-amplify/auth";


const WorkspaceDialog = ({
    visible,
    onDismiss,
    setWorkspaceModal,
    router,
    showGoBack = false,
    showSignOut = false
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
                    <View style={styles.bottomActionContainer}>
                        <TouchableOpacity onPress={() => setWorkspaceModal(false)}>
                            <Text>Go back</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {showSignOut && (
                    <View style={styles.bottomActionContainer}>
                        <TouchableOpacity onPress={async () => {
                            try {
                                await signOut();
                                router.navigate('landing');
                            } catch (error) {
                                console.error(`Error signing out:`, error);
                            }
                        }}>
                            <Text>Sign Out</Text>
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
    bottomActionContainer: {
        alignItems: "center",
        marginBottom: 20
    }
})

export default WorkspaceDialog;