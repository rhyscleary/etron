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
  connection
}) => {
  const theme = useTheme();
  
  if (!connection) return null;

  const statusColor = ['active', 'connected'].includes(connection.status?.toLowerCase()) ? theme.colors.themeGreen : theme.colors.error;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, { backgroundColor: theme.colors.background }]}>
        <Dialog.Title style={[commonStyles.titleText, styles.title]}>
          {connection.title || "Connection Created"}
        </Dialog.Title>

        <Dialog.Content>
          <StackLayout spacing={15}>
            <Text style={[commonStyles.listItemText, styles.centerText, { color: theme.colors.themeGrey }]}>
              {connection.message || "Your connection has been successfully created and is ready to use."}
            </Text>

            <Divider color={theme.colors.buttonBackground} />

            <StackLayout spacing={10}>
              {/* Name */}
              <View style={styles.row}>
                <Text style={commonStyles.bodyText}>Name:</Text>
                <Text style={[commonStyles.bodyText, styles.valueRight, { fontWeight: 'bold' }]}>
                  {connection.name}
                </Text>
              </View>

              {/* Status */}
              <View style={styles.row}>
                <Text style={commonStyles.bodyText}>Status:</Text>
                <Text style={[commonStyles.bodyText, styles.valueRight, { color: statusColor }]}>
                  ● {connection.status}
                </Text>
              </View>

              {/* details */}
              {connection.details && connection.details.map((detail, index) => (
                <View key={index} style={styles.row}>
                  <Text style={commonStyles.bodyText}>{detail.label}:</Text>
                  <Text style={[
                    commonStyles.captionText, 
                    styles.valueRight, 
                    { fontStyle: 'italic', color: theme.colors.themeGrey }
                  ]} numberOfLines={2}>
                    {detail.value}
                  </Text>
                </View>
              ))}

              {/* Created timestamp */}
              <View style={styles.row}>
                <Text style={commonStyles.bodyText}>Created:</Text>
                <Text style={[
                  commonStyles.captionText, 
                  styles.valueRight, 
                  { fontStyle: 'italic', color: theme.colors.themeGrey }
                ]}>
                  {new Date(connection.createdAt).toLocaleString()}
                </Text>
              </View>
            </StackLayout>

            {/* Test Results */}
            {connection.testResult && (
              <>
                <Divider color={theme.colors.buttonBackground} />
                <Text style={[commonStyles.listItemText, styles.testTitle]}>Test Results</Text>
                <View style={[styles.resultBox, { backgroundColor: theme.colors.buttonBackground }]}>
                  {renderTestResults(connection.testResult, theme)}
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

const renderTestResults = (testResult, theme) => {
  const textStyle = [commonStyles.captionText, { color: theme.colors.themeGrey }];

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1') // add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // capitalise first letter
      .replace(/\b\w/g, str => str.toUpperCase()); // capitalise each word
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    
    if (typeof value === 'object') {
      // string if nested
      return JSON.stringify(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  // filter out non-renderable entries
  const renderableEntries = Object.entries(testResult).filter(([key, value]) => {
    // skip keys that start with an underscore
    if (key.startsWith('_')) return false;
    
    // skip empty strings
    if (typeof value === 'function') return false;
    
    // skip null or undefined values
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const stringified = JSON.stringify(value);
      if (stringified.length > 100) return false;
    }
    
    return true;
  });

  return (
    <StackLayout spacing={5}>
      {renderableEntries.map(([key, value]) => (
        <View key={key} style={styles.resultRow}>
          <Text style={commonStyles.captionText}>{formatLabel(key)}:</Text>
          <Text style={[textStyle, styles.resultValue]} numberOfLines={3}>
            {formatValue(value)}
          </Text>
        </View>
      ))}
      
      {renderableEntries.length === 0 && (
        <Text style={[textStyle, styles.centerText]}>
          No test result details available
        </Text>
      )}
    </StackLayout>
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
    alignItems: 'flex-start',
  },
  valueRight: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
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
    alignItems: 'flex-start',
    minHeight: 20,
  },
  resultValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  }
});

export default ConnectionDialog;