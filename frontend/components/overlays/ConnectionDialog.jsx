import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text, Dialog, Portal } from 'react-native-paper';
import StackLayout from '../layout/StackLayout';
import { commonStyles } from '../../assets/styles/stylesheets/common';
import Divider from '../layout/Divider';
import BasicButton from '../common/buttons/BasicButton';

const ConnectionDialog = ({ 
    visible, 
    onDismiss, 
    onConfirm, 
    connection,
    title = "Connection Created",
    message = "Your custom API connection has been successfully created and is ready to use."
}) => {
    const theme = useTheme();
    if (!connection) return null;

    const statusColor = connection.status === 'active' ? theme.colors.themeGreen : theme.colors.error;

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, { backgroundColor: theme.colors.background }]}>
                <Dialog.Title style={[commonStyles.titleText, styles.title]}>{title}</Dialog.Title>

                <Dialog.Content>
                    <StackLayout spacing={15}>
                        <Text style={[commonStyles.listItemText, styles.centerText, { color: theme.colors.themeGrey }]}>
                            {message}
                        </Text>

                        <Divider color={theme.colors.buttonBackground} />

                        <StackLayout spacing={10}>
                            <View style={styles.row}>
                                <Text style={commonStyles.bodyText}>Name:</Text>
                                <Text style={[commonStyles.bodyText, styles.valueRight, { fontWeight: 'bold' }]}>{connection.name}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={commonStyles.bodyText}>Status:</Text>
                                <Text style={[commonStyles.bodyText, styles.valueRight, { color: statusColor }]}>
                                    ● {connection.status === 'active' ? 'Active' : 'Inactive'}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={commonStyles.bodyText}>URL:</Text>
                                <Text style={[commonStyles.captionText, styles.valueRight, { fontStyle: 'italic', color: theme.colors.themeGrey }]} numberOfLines={2}>{connection.url}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={commonStyles.bodyText}>Created:</Text>
                                <Text style={[commonStyles.captionText, styles.valueRight, { fontStyle: 'italic', color: theme.colors.themeGrey }]}>
                                    {new Date(connection.createdAt).toLocaleString()}
                                </Text>
                            </View>
                        </StackLayout>

                        {connection.testResult && (
                            <>
                                <Divider color={theme.colors.buttonBackground} />
                                <Text style={[commonStyles.listItemText, styles.testTitle]}>Test Results</Text>
                                <View style={[styles.resultBox, { backgroundColor: theme.colors.buttonBackground }]}>
                                    <View style={styles.resultRow}>
                                        <Text style={commonStyles.captionText}>Response Time:</Text>
                                        <Text style={[commonStyles.captionText, { color: theme.colors.themeGrey }]}>{connection.testResult.responseTime}</Text>
                                    </View>
                                    <View style={styles.resultRow}>
                                        <Text style={commonStyles.captionText}>Status Code:</Text>
                                        <Text style={[commonStyles.captionText, { color: theme.colors.themeGrey }]}>{connection.testResult.statusCode}</Text>
                                    </View>
                                    <View style={styles.resultRow}>
                                        <Text style={commonStyles.captionText}>Content Type:</Text>
                                        <Text style={[commonStyles.captionText, { color: theme.colors.themeGrey }]}>{connection.testResult.contentType}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </StackLayout>
                </Dialog.Content>
                
                        
                <Dialog.Actions style={styles.actions}> 
                    <BasicButton
                        label="Continue"
                        onPress={onConfirm}
                        fixedWidth
                    />
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 10,
    },
    title: {
        textAlign: 'center',
    },
    centerText: {
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    valueRight: {
        flex: 1,
        textAlign: 'right',
    },
    testTitle: {
        marginVertical: 10,
    },
    resultBox: {
        padding: 12,
        borderRadius: 4,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 16,
    }
});

export default ConnectionDialog;
