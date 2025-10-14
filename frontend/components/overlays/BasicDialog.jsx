// Author(s): Rhys Cleary

import { Dialog, Portal, Text, useTheme } from "react-native-paper";
import BasicButton from "../common/buttons/BasicButton";
import TextField from "../common/input/TextField";
import { StyleSheet, View } from "react-native";


const BasicDialog = ({
    visible,
    onDismiss,
    title = "",
    message = "",
    showInput = false,
    inputLabel = "",
    inputValue = "",
    inputPlaceholder = "",
    inputOnChangeText = () => {},
    leftActionLabel = "Cancel",
    leftDanger = false,
    handleLeftAction = () => {},
    rightActionLabel = "Confirm",
    rightDanger = false,
    rightDisabled = false,
    handleRightAction = () => {},
    inputError = false,
    inputErrorMessage = "",
    secureTextEntry = false,
    children,
}) => {
    const theme = useTheme();

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, {backgroundColor: theme.colors.surface}]}>
                {title ? <Dialog.Title style={styles.title}>{title}</Dialog.Title> : null}

                <Dialog.Content>
                    <Text variant="bodyLarge">{message}</Text>

                    {children}
                    
                    {showInput && (
                        <View style={styles.inputContainer}>
                            <TextField 
                                label={inputLabel} 
                                value={inputValue} 
                                placeholder={inputPlaceholder} 
                                onChangeText={inputOnChangeText}
                                error={inputError}
                                secureTextEntry={secureTextEntry}
                            />
                        </View>
                    )}
                    {inputError && (
                        <Text style={{color: theme.colors.error}}>{inputErrorMessage}</Text> 
                    )}
                </Dialog.Content>

                <Dialog.Actions style={styles.actions}>
                    <BasicButton label={leftActionLabel} danger={leftDanger} onPress={(handleLeftAction)}/>
                    <BasicButton label={rightActionLabel} danger={rightDanger} disabled={rightDisabled}onPress={handleRightAction}/>
                </Dialog.Actions>
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
    actions: {
        justifyContent: "space-between"
    }
})

export default BasicDialog;