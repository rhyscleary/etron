import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { commonStyles } from '../../assets/styles/stylesheets/common';
import Divider from '../layout/Divider';

const TestResultCard = ({ 
    result, 
    error, 
    title = "Test Results"
}) => {
    const theme = useTheme();
    
    if (!result && !error) return null;
    
    const { isError, isSuccess } = useMemo(() => ({
        isError: !!error,
        isSuccess: result?.status === 'success'
    }), [result, error]);

    const borderColor = useMemo(() => (
        isError ? theme.colors.error :
        isSuccess ? theme.colors.themeGreen :
        theme.colors.secondary
    ), [isError, isSuccess, theme.colors]);

    const statusColor = isSuccess ? theme.colors.themeGreen : theme.colors.error;

    const renderRow = (label, value, valueStyle) => (
        <View style={styles.row}>
            <Text style={commonStyles.bodyText}>{label}</Text>
            <Text style={[commonStyles.captionText, styles.valueRight, valueStyle]}>
                {value}
            </Text>
        </View>
    );

    return (
        <Card style={[styles.card, { borderColor, backgroundColor: theme.colors.background }]}>
            <View style={styles.titleContainer}>
                <Text style={[commonStyles.titleText, styles.title, { color: borderColor }]}>
                    {title}
                </Text>
                <Divider color={theme.colors.buttonBackground} />
            </View>
            <Card.Content>
                <View style={styles.contentWrapper}>
                    {isError ? (
                        renderRow('Error', error, { color: theme.colors.error })
                    ) : (
                        <>
                            {renderRow('Status:', result.status, { color: statusColor })}
                            {renderRow('Response Time:', result.responseTime)}
                            {renderRow('Status Code:', result.statusCode)}
                            {renderRow('Content Type:', result.contentType)}
                            <Divider color={theme.colors.buttonBackground} />
                            {result.sampleData && (
                                <View style={styles.sampleRow}>
                                    <Text style={commonStyles.bodyText}>Sample Data:</Text>
                                    <Text style={[
                                        styles.jsonBlock,
                                        {
                                            backgroundColor: theme.colors.buttonBackground,
                                            color: theme.colors.themeGrey
                                        }
                                    ]}>
                                        {JSON.stringify(result.sampleData, null, 2)}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginTop: 20,
        borderWidth: 2,
        borderRadius: 12,
        elevation: 2,
    },
    titleContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        textAlign: 'center',
        fontSize: 18,
        paddingBottom: 10,
    },
    contentWrapper: {
        marginTop: 4,
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    valueRight: {
        flex: 1,
        textAlign: 'right',
    },
    sampleRow: {
        marginTop: 10,
    },
    jsonBlock: {
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 18,
        padding: 8,
        borderRadius: 4,
        marginTop: 4,
    }
});

export default TestResultCard;
