// Author(s): Rhys Cleary

import { Dialog, Portal, Text, useTheme } from "react-native-paper";
import BasicButton from "../common/buttons/BasicButton";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import TextField from "../common/input/TextField";


const VerificationDialog = ({
    visible,
    code,
    setCode,
    onConfirm,
    onResend,
    onLater,
    resendCooldown = 0,
    error
}) => {
    const theme = useTheme();

    return (
        <Portal>
            <Dialog 
                visible={visible} 
                style={[styles.dialog, {backgroundColor: theme.colors.surface}]}
                //theme={{colors: {backdrop: `rgba(0,0,0,0.4)`}}}
            >
                <Dialog.Title style={styles.title}>Enter Verification Code</Dialog.Title>

                <Dialog.Content>
                    <View style={styles.inputContainer}>
                        <TextField
                            placeholder="Code"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="numeric"
                            error={!!error}
                            contentStyle={{ textAlign: "center" }}
                        />
                    </View>

                    {error ? (
                        <Text style={{color: theme.colors.error, marginTop: 10, textAlign: "center"}}>
                            {error}
                        </Text>
                    ) : null}
                </Dialog.Content>

                <Dialog.Actions style={styles.actions}>
                    <BasicButton 
                        label="Do this later" 
                        onPress={onLater}
                    />
                    <BasicButton 
                        label="Confirm" 
                        onPress={onConfirm}
                    />
                </Dialog.Actions>

                <View style={styles.resendContainer}>
                    <TouchableOpacity 
                        onPress={onResend}
                        disabled={resendCooldown > 0}
                    >
                        <Text
                            style={[
                                styles.resendText,
                                resendCooldown > 0 && { color: theme.colors.error}
                            ]}
                        >
                            {resendCooldown > 0
                                ? `Resend code in ${resendCooldown}s`
                                : "Resend code"
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
                
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 10
    },
    inputContainer: {
        marginTop: 20,
        width: 200,
        alignSelf: "center"
    },
    title: {
        textAlign: "center"
    },
    message: {
        fontSize: 16,
        textAlign: "center",
    },
    actions: {
        marginTop: 20,
        justifyContent: "space-between"
    },
    resendContainer: {
        alignItems: "center",
        marginBottom: 20
    },
    resendText: {
        fontSize: 14,
    }
    

})

export default VerificationDialog;