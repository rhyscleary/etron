// Author(s): Rhys Cleary

import { Dialog, Portal, Text, useTheme } from "react-native-paper";
import BasicButton from "../common/buttons/BasicButton";
import { StyleSheet, TouchableOpacity, View, Keyboard, Pressable } from "react-native";
import { signOut } from "aws-amplify/auth";
import { useEffect } from "react";


const DecisionDialog = ({
    visible,
    onDismiss,
    showGoBack = false,
    showSignOut = false,
    title = "",
    message = "",
    leftActionLabel = "Cancel",
    leftDanger = false,
    handleLeftAction = () => {},
    rightActionLabel = "Confirm",
    rightDanger = false,
    handleRightAction = () => {},
    handleGoBack = () => {}
}) => {
    const theme = useTheme();

    useEffect(() => {
        if (visible) Keyboard.dismiss();
    }, [visible]);

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, {backgroundColor: theme.colors.surface}]}>
                <Pressable onPressIn={Keyboard.dismiss} android_disableSound>
                    <Dialog.Title style={styles.title}>{title}</Dialog.Title>

                
                    <View>
                        <Dialog.Content>
                            <Text style={styles.message}>
                                {message}
                            </Text>
                        </Dialog.Content>
                    </View>
                

                    <Dialog.Actions style={styles.actions}>
                        <BasicButton 
                            label={leftActionLabel}
                            danger={leftDanger}
                            onPress={handleLeftAction}
                        />
                        <BasicButton 
                            label={rightActionLabel}
                            danger={rightDanger} 
                            onPress={handleRightAction}
                        />
                    </Dialog.Actions>

                    {showGoBack && (
                        <View style={styles.bottomActionContainer}>
                            <TouchableOpacity onPress={handleGoBack}>
                                <Text>Go back</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {showSignOut && (
                        <View style={styles.bottomActionContainer}>
                            <TouchableOpacity onPress={async () => {
                                try {
                                    await signOut();
                                } catch (error) {
                                    console.error(`Error signing out:`, error);
                                }
                            }}>
                                <Text>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Pressable>
                
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

export default DecisionDialog;