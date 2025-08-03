import { View, Alert } from "react-native";
import { ScrollView } from "react-native";
import { useTheme, Text } from "react-native-paper";
import { router } from "expo-router";
import { useState, useEffect, useMemo } from "react";

import Header from "./Header";
import StackLayout from "./StackLayout";
import BasicButton from "../../components/common/buttons/BasicButton";
import IconButton from "../../components/common/buttons/IconButton";
import TestResultCard from "../../components/cards/testResultCard";
import ConnectionDialog from "../../components/overlays/ConnectionDialog";
import CollapsibleList from "./CollapsibleList";
import Divider from "./Divider";

import { commonStyles } from "../../assets/styles/stylesheets/common";
import { apiPost } from "../../utils/api/apiClient";
import endpoints from "../../utils/api/endpoints";

import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

import { createDataAdapter } from "../../adapters/day-book/data-sources";

const useDataSource = (adapterType) => {
  const [adapter, setAdapter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const newAdapter = createDataAdapter(adapterType, {
        authService: { getCurrentUser, fetchAuthSession, signOut },
        apiClient: { post: apiPost },
        endpoints,
        options: {
          demoMode: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
          fallbackToDemo: true
        }
      });

      if (newAdapter) {
        setAdapter(newAdapter);
        const info = newAdapter.getConnectionInfo();
        setConnectionInfo(info);
      } else {
        throw new Error('Failed to create adapter - adapter is null');
      }
    } catch (err) {
      setError(`Failed to create adapter: ${err.message}`);
      console.error('Adapter creation error:', err);
    }
  }, [adapterType]);

  const testConnection = async (connectionData) => {
    if (!adapter) {
      const errorMsg = 'Adapter not initialized';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);

    try {
      const result = await adapter.testConnection(connectionData);
      return result;
    } catch (error) {
      console.error('Test connection error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const connect = async (connectionData) => {
    if (!adapter) {
      const errorMsg = 'Adapter not initialized';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);

    try {
      const result = await adapter.connect(connectionData);
      const info = adapter.getConnectionInfo();
      setConnectionInfo(info);
      return result;
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!adapter) return;

    try {
      await adapter.disconnect();
      setConnectionInfo(null);
      setError(null);
    } catch (error) {
      console.error('Disconnect error:', error);
      setError(error.message);
      throw error;
    }
  };

  return {
    adapter,
    loading,
    connectionInfo,
    error,
    testConnection,
    connect,
    disconnect,
    isConnected: () => adapter?.isConnected() || false
  };
};

const TestConnectionSection = ({
  isTestingConnection, testResponse, connectionError,
  onTestConnection, canTest, theme
}) => (
  <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
    <StackLayout spacing={15}>
      <Text style={[commonStyles.captionText, { color: theme.colors.onSurfaceVariant }]}>
        Test your connection before creating it to ensure everything works correctly.
      </Text>

      <IconButton
        label={isTestingConnection ? "Testing..." : "Test Connection"}
        icon="connection"
        onPress={onTestConnection}
        loading={isTestingConnection}
        disabled={!canTest}
      />

      {testResponse && (
        <>
          <Divider color={theme.colors.buttonBackground} />
          <TestResultCard
            result={testResponse}
            title="Test Results"
          />
        </>
      )}

      {connectionError && (
        <>
          <Divider color={theme.colors.buttonBackground} />
          <TestResultCard
            error={connectionError}
            title="Connection Error"
          />
        </>
      )}
    </StackLayout>
  </View>
);

const ConnectionPage = ({ 
  connectionType, 
  title, 
  FormComponent, 
  formValidator, 
  connectionDataBuilder,
  nameGenerator 
}) => {
  const theme = useTheme();

  const {
    adapter,
    loading: adapterLoading,
    connectionInfo,
    error: adapterError,
    testConnection: adapterTestConnection,
    connect: adapterConnect,
    isConnected
  } = useDataSource(connectionType);

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const [connection, setConnection] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const [testResponse, setTestResponse] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const [genNameFocused, setGenNameFocused] = useState(false);

  function generateName() {
    if (nameGenerator && !formData.name ) {
      const generatedName = nameGenerator(formData);
      if (generatedName) {
        return generatedName;
      }
    }
  }

  const formIsValid = useMemo(() => {
    return formValidator ? formValidator(formData) : true;
  }, [formData, formValidator]);

  const validateForm = () => {
    if (!formValidator) return true;
    
    const validation = formValidator(formData, true);
    if (validation === true) {
      setErrors({});
      return true;
    }
    
    setErrors(validation || {});
    return false;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setIsTestingConnection(true);
    setConnectionError(null);
    setTestResponse(null);

    try {
      const connectionData = connectionDataBuilder ? connectionDataBuilder(formData) : formData;
      const result = await adapterTestConnection(connectionData);
      setTestResponse(result);
      setConnectionError(null);
    } catch (error) {
      console.error('Error testing connection:', error);
      const errorMsg = error.message || "Failed to test connection";
      setConnectionError(errorMsg);
      setTestResponse(null);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleContinue = async () => {
    if (!testResponse || testResponse.status !== "success") return;

    try {
      const connectionData = connectionDataBuilder ? connectionDataBuilder(formData) : formData;
      const result = await adapterConnect(connectionData);

      if (result.success) {
        // Format connection data for dialog display
        const dialogData = formatConnectionForDialog(result.connection, connectionType, testResponse);
        setConnection(dialogData);
        setShowSuccessDialog(true);
      } else {
        Alert.alert("Connection Failed", "Unable to create connection. Please try again.");
      }
    } catch (error) {
      console.error('Connection creation error:', error);
      Alert.alert("Error", `Failed to create connection: ${error.message}`);
    }
  };

  // Format connection data for dialog display
  const formatConnectionForDialog = (connection, type, testResult) => {
    const baseData = {
      name: connection.name,
      status: connection.status || 'active',
      createdAt: connection.createdAt || new Date().toISOString(),
      testResult: testResult?.status === 'success' ? testResult.data : null,
      // Keep original connection data for navigation
      originalConnection: connection
    };

    // Add type-specific display fields
    switch (type) {
      case 'custom-api':
        return {
          ...baseData,
          title: "API Connection Created",
          message: "Your custom API connection has been successfully created and is ready to use.",
          details: [
            { label: "URL", value: connection.url },
            { label: "Type", value: "REST API" },
            { label: "Authentication", value: connection.authentication ? "Configured" : "None" }
          ]
        };

      case 'custom-ftp':
        return {
          ...baseData,
          title: "FTP Connection Created", 
          message: "Your FTP connection has been successfully created and is ready to use.",
          details: [
            { label: "Hostname", value: connection.hostname },
            { label: "Port", value: connection.port || "21" },
            { label: "Username", value: connection.username },
            { label: "Directory", value: connection.directory || "/" },
            { label: "Protocol", value: connection.keyFile ? "SFTP" : "FTP" }
          ]
        };

        case 'custom-mysql': // Add MySQL case
          return {
            ...baseData,
            title: "MySQL Connection Created",
            message: "Your MySQL connection has been successfully created and is ready to use.",
            details: [
              { label: "Host", value: connection.host }, // Changed from hostname to host
              { label: "Port", value: connection.port || "3306" },
              { label: "Username", value: connection.username },
              { label: "Database", value: connection.database },
              { label: "SSL", value: connection.sslCA ? "Enabled" : "Disabled" }
            ]
          };

      default:
        return {
          ...baseData,
          title: "Connection Created",
          message: "Your connection has been successfully created and is ready to use.",
          details: [
            { label: "Type", value: type },
            { label: "Name", value: connection.name }
          ]
        };
    }
  };

  const navigateToDataManagement = (connectionData) => {
    // Use original connection data for navigation
    const originalConnection = connectionData.originalConnection || connectionData;
    
    router.push({
      pathname: "/modules/day-book/data-management/data-management",
      params: {
        type: connectionType,
        connectionId: originalConnection.id,
        name: originalConnection.name,
        status: originalConnection.status,
        ...originalConnection
      },
    });
  };

  const handleDialogConfirm = () => {
    setShowSuccessDialog(false);
    navigateToDataManagement(connection);
  };

  const getTestSectionStatus = () => {
    if (testResponse) return { description: "Connection tested successfully", icon: "wifi-check" };
    if (connectionError) return { description: "Connection test failed", icon: "wifi-alert" };
    return { description: "Test your connection", icon: "wifi-sync" };
  };

  const getFormDescription = () => {
    if (!formData.name) return "Configure your connection";
    const primaryInfo = formData.url || formData.hostname || 'connection';
    return `${formData.name} • ${primaryInfo}`;
  };

  const testSectionStatus = getTestSectionStatus();

  return (
    <View style={commonStyles.screen}>
      <Header title={title} showBack />

      <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
        <StackLayout spacing={0}>

          {/* Error Display */}
          {adapterError && (
            <View style={{
              padding: 15,
              backgroundColor: theme.colors.errorContainer,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <Text style={{ color: theme.colors.onErrorContainer }}>
                {adapterError}
              </Text>
            </View>
          )}

          {/* Demo Mode Indicator */}
          {connectionInfo?.isDemoMode && (
            <View style={{
              padding: 15,
              backgroundColor: theme.colors.secondaryContainer,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <Text style={{
                color: theme.colors.onSecondaryContainer,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                🚀 Demo Mode Active
              </Text>
              <Text style={{
                color: theme.colors.onSecondaryContainer,
                textAlign: 'center',
                fontSize: 12,
                marginTop: 4
              }}>
                Using sample data for development
              </Text>
            </View>
          )}

          <CollapsibleList
            canCloseFormAccordion={formIsValid}
            items={[
              {
                key: "form",
                title: `${title} Configuration`,
                description: getFormDescription(),
                icon: connectionType === 'custom-api' ? 'web' : 'server',
                defaultExpanded: true,
                disabled: false,
                content: (
                  <FormComponent
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    isConnected={isConnected()}
                    theme={theme}
                    onFieldBlur={generateName}
                  />
                ),
              },
              {
                key: "test",
                title: "Test Connection",
                description: testSectionStatus.description,
                icon: testSectionStatus.icon,
                defaultExpanded: formIsValid && !isConnected(),
                disabled: !formIsValid || isConnected(),
                content: (
                  <TestConnectionSection
                    isTestingConnection={isTestingConnection || adapterLoading}
                    testResponse={testResponse}
                    connectionError={connectionError}
                    onTestConnection={handleTestConnection}
                    canTest={formIsValid}
                    theme={theme}
                  />
                ),
              },
            ]}
          />
        </StackLayout>
      </ScrollView>

      {/* Continue Button */}
      <View style={commonStyles.floatingButtonContainer}>
        <BasicButton
          label={adapterLoading ? "Creating Connection..." : "Create Connection"}
          onPress={handleContinue}
          disabled={adapterLoading || !testResponse || testResponse.status !== "success"}
          fullWidth={false}
        />
      </View>

      {/* Dialog */}
      <ConnectionDialog
        visible={showSuccessDialog}
        onDismiss={() => setShowSuccessDialog(false)}
        onConfirm={handleDialogConfirm}
        connection={connection}
      />
    </View>
  );
};

export default ConnectionPage;