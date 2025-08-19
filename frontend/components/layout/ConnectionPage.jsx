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
import useDataSources from "../../hooks/useDataSource";
import { createDataAdapter } from "../../adapters/day-book/data-sources";
import { apiPost } from "../../utils/api/apiClient";
import endpoints from "../../utils/api/endpoints";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

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
          <TestResultCard result={testResponse} title="Test Results" />
        </>
      )}

      {connectionError && (
        <>
          <Divider color={theme.colors.buttonBackground} />
          <TestResultCard error={connectionError} title="Connection Error" />
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

  // Use the global data sources hook for all data source operations
  const {
    dataSources,
    loading: dataSourcesLoading,
    error: dataSourcesError,
    connectDataSource,
    testConnection: testDataSourceConnection,
  } = useDataSources();

  // Local form state
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [connection, setConnection] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [testResponse, setTestResponse] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [adapter, setAdapter] = useState(null);
  const [adapterError, setAdapterError] = useState(null);
  
  // Accordion state management
  const [expandedSections, setExpandedSections] = useState(new Set(['form']));

  // Initialize adapter for this connection type
  useEffect(() => {
    try {
      // Create API client and auth service (same as in useDataSources)
      const apiClient = {
        post: apiPost,
        get: async (url) => ({ data: [] }),
        put: async (url, data) => ({ data: {} }),
        delete: async (url) => ({ data: {} })
      };

      const authService = { getCurrentUser, fetchAuthSession, signOut };

      const newAdapter = createDataAdapter(connectionType, {
        authService,
        apiClient,
        endpoints,
        options: {
          demoMode: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
          fallbackToDemo: true
        }
      });

      if (!newAdapter) throw new Error('Failed to create adapter - adapter is null');
      
      setAdapter(newAdapter);
      setAdapterError(null);
    } catch (err) {
      setAdapterError(`Failed to create adapter: ${err.message}`);
      console.error('Adapter creation error:', err);
    }
  }, [connectionType]);

  // Auto-expand test section when form becomes valid
  useEffect(() => {
    if (formIsValid && !isConnected()) {
      setExpandedSections(prev => new Set([...prev, 'test']));
    }
  }, [formIsValid, isConnected]);

  const handleSectionToggle = (sectionKey) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const generateName = () => {
    if (nameGenerator && !formData.name) {
      const generatedName = nameGenerator(formData);
      if (generatedName) {
        return generatedName;
      }
    }
  };

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

  /*const handleTestConnection = async () => {
    if (!validateForm()) return;
    if (!adapter) {
      setConnectionError("Adapter not initialized");
      return;
    }

    setIsTestingConnection(true);
    setConnectionError(null);
    setTestResponse(null);

    try {
      const connectionData = connectionDataBuilder ? connectionDataBuilder(formData) : formData;
      const connectionName = formData.name || generateName() || `${title} Connection`;
      
      // Use the testConnection from useDataSources hook
      const result = await testDataSourceConnection(connectionType, connectionData, connectionName);
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
  };*/
  // fake
  const handleTestConnection = async () => {
  if (!validateForm()) return;
  if (!adapter) {
    setConnectionError("Adapter not initialized");
    return;
  }

  setIsTestingConnection(true);
  setConnectionError(null);
  setTestResponse(null);

  try {
    // Simulate a fake successful test result
    const fakeResult = {
      status: "success",
      data: {
        message: "Mock connection test passed",
        timestamp: new Date().toISOString()
      }
    };

    await new Promise(resolve => setTimeout(resolve, 500)); // simulate network delay

    setTestResponse(fakeResult);
    setConnectionError(null);
  } catch (error) {
    setConnectionError("Mock connection failed");
  } finally {
    setIsTestingConnection(false);
  }
};


  const handleContinue = async () => {
    if (!testResponse || testResponse.status !== "success") return;

    setIsCreatingConnection(true);
    try {
      const connectionData = connectionDataBuilder ? connectionDataBuilder(formData) : formData;
      const connectionName = formData.name || generateName() || `${title} Connection`;
      
      // Use the connectDataSource from useDataSources hook
      const result = await connectDataSource(connectionType, connectionData, connectionName);

      if (result) {
        const dialogData = formatConnectionForDialog(result, connectionType, testResponse);
        setConnection(dialogData);
        setShowSuccessDialog(true);
      } else {
        Alert.alert("Connection Failed", "Unable to create connection. Please try again.");
      }
    } catch (error) {
      console.error('Connection creation error:', error);
      Alert.alert("Error", `Failed to create connection: ${error.message}`);
    } finally {
      setIsCreatingConnection(false);
    }
  };

  // Format connection data for dialog display
  const formatConnectionForDialog = (connection, type, testResult) => {
    const baseData = {
      name: connection.name,
      status: connection.status || 'connected',
      createdAt: connection.createdAt || new Date().toISOString(),
      testResult: testResult?.status === 'success' ? testResult.data : null,
      originalConnection: connection
    };

    const formatters = {
      'custom-api': (conn) => ({
        ...baseData,
        title: "API Connection Created",
        message: "Your custom API connection has been successfully created and is ready to use.",
        details: [
          { label: "URL", value: conn.config?.url || formData.url },
          { label: "Type", value: "REST API" },
          { label: "Authentication", value: conn.config?.authentication || formData.authentication ? "Configured" : "None" }
        ]
      }),

      'custom-ftp': (conn) => ({
        ...baseData,
        title: "FTP Connection Created", 
        message: "Your FTP connection has been successfully created and is ready to use.",
        details: [
          { label: "Hostname", value: conn.config?.hostname || formData.hostname },
          { label: "Port", value: conn.config?.port || formData.port || "21" },
          { label: "Username", value: conn.config?.username || formData.username },
          { label: "Directory", value: conn.config?.directory || formData.directory || "/" },
          { label: "Protocol", value: conn.config?.keyFile || formData.keyFile ? "SFTP" : "FTP" }
        ]
      }),

      'custom-mysql': (conn) => ({
        ...baseData,
        title: "MySQL Connection Created",
        message: "Your MySQL connection has been successfully created and is ready to use.",
        details: [
          { label: "Host", value: conn.config?.host || formData.host },
          { label: "Port", value: conn.config?.port || formData.port || "3306" },
          { label: "Username", value: conn.config?.username || formData.username },
          { label: "Database", value: conn.config?.database || formData.database },
          { label: "SSL", value: conn.config?.sslCA || formData.sslCA ? "Enabled" : "Disabled" }
        ]
      })
    };

    const formatter = formatters[type];
    if (formatter) {
      return formatter(connection);
    }

    return {
      ...baseData,
      title: "Connection Created",
      message: "Your connection has been successfully created and is ready to use.",
      details: [
        { label: "Type", value: type },
        { label: "Name", value: connection.name }
      ]
    };
  };

  const navigateToDataManagement = (connectionData) => {
    const originalConnection = connectionData.originalConnection || connectionData;
    
    router.navigate({
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
    const primaryInfo = formData.url || formData.hostname || formData.host || 'connection';
    return `${formData.name} • ${primaryInfo}`;
  };

  // Check if there's an existing connection of this type
  const existingConnection = dataSources.find(source => source.type === connectionType);
  const isConnected = () => existingConnection?.status === 'connected';

  const testSectionStatus = getTestSectionStatus();
  const isLoading = dataSourcesLoading || isTestingConnection || isCreatingConnection;
  const hasError = adapterError || dataSourcesError;

  return (
    <View style={commonStyles.screen}>
      <Header title={title} showBack />

      <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
        <StackLayout spacing={0}>

          {/* Error Display */}
          {hasError && (
            <View style={{
              padding: 15,
              backgroundColor: theme.colors.errorContainer,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <Text style={{ color: theme.colors.onErrorContainer }}>
                {adapterError || dataSourcesError}
              </Text>
            </View>
          )}

          {/* Demo Mode Indicator */}
          {adapter?.getConnectionInfo?.()?.isDemoMode && (
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
            expandedSections={expandedSections}
            onSectionToggle={handleSectionToggle}
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
                    isTestingConnection={isTestingConnection}
                    testResponse={testResponse}
                    connectionError={connectionError}
                    onTestConnection={handleTestConnection}
                    canTest={formIsValid && adapter}
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
          label={isCreatingConnection ? "Creating Connection..." : "Create Connection"}
          onPress={handleContinue}
          disabled={isLoading || !testResponse || testResponse.status !== "success"}
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