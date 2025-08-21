import { View, Alert, ScrollView } from "react-native";
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
import { useApp } from "../../contexts/AppContext";
import { demoConfigManager } from "../../config/demoConfig";
import { createDataAdapter } from "../../adapters/day-book/data-sources";
import { apiPost } from "../../utils/api/apiClient";
import endpoints from "../../utils/api/endpoints";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

// --- Test Connection Section ---
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

// --- Main Page ---
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
    dataSources: { list: dataSources, isDemoMode },
    demo: { status: demoStatus, config: demoConfig },
    actions: { connectDataSource, testConnection: testDataSourceConnection },
  } = useApp();

  // State
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
  const [expandedSections, setExpandedSections] = useState(new Set(['form']));

  // Adapter setup
  useEffect(() => {
    try {
  console.log('[ConnectionPage] creating adapter', { connectionType, isDemoMode, demoStatus: demoStatus, perTypeDemo: demoConfigManager?.isDataSourceTypeInDemo ? demoConfig?.components && (typeof demoConfig.components.dataSources === 'object' ? !!demoConfig.components.dataSources[connectionType] : demoConfig.components.dataSources) : undefined });
      const apiClient = {
        post: apiPost,
        get: async () => ({ data: [] }),
        put: async () => ({ data: {} }),
        delete: async () => ({ data: {} })
      };
      const authService =
        Array.isArray(demoStatus?.activeComponents) && demoStatus.activeComponents.includes('authentication')
          ? {
              getCurrentUser: () => Promise.resolve({ username: 'demo_user' }),
              fetchAuthSession: () => Promise.resolve({ tokens: { accessToken: 'demo_token' } }),
              signOut: () => Promise.resolve(),
            }
          : { getCurrentUser, fetchAuthSession, signOut };
    const newAdapter = createDataAdapter(connectionType, {
        authService,
        apiClient,
        endpoints,
        options: {
      fallbackToDemo: demoConfig.fallback.enableOnApiFailure,
      demoConfig
        }
      });
      if (!newAdapter) throw new Error('Failed to create adapter - adapter is null');
      setAdapter(newAdapter);
      setAdapterError(null);
    } catch (err) {
      setAdapterError(`Failed to create adapter: ${err.message}`);
  console.error('[ConnectionPage] Adapter creation error:', err);
    }
  }, [connectionType, isDemoMode, demoStatus, demoConfig]);

  // Expand test section when form valid
  const formIsValid = useMemo(() => formValidator ? formValidator(formData) : true, [formData, formValidator]);
  useEffect(() => {
    if (formIsValid && !isConnected()) {
      setExpandedSections(prev => new Set([...prev, 'test']));
    }
    // eslint-disable-next-line
  }, [formIsValid, isConnected]);

  // Accordion toggle
  const handleSectionToggle = (sectionKey) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.has(sectionKey) ? newSet.delete(sectionKey) : newSet.add(sectionKey);
      return newSet;
    });
  };

  // Name generator
  const generateName = () => {
    if (nameGenerator && !formData.name) {
      const generatedName = nameGenerator(formData);
      if (generatedName) return generatedName;
    }
  };

  // Form validation
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

  // Test connection
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
      const connectionData = connectionDataBuilder ? connectionDataBuilder(formData) : formData;
      const connectionName = formData.name || generateName() || `${title} Connection`;
      let result;
      if (isDemoMode || demoConfig.behavior.simulateNetworkDelay) {
        const delay = Math.random() * 1000 + 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        if (demoConfig.behavior.simulateErrors && Math.random() < 0.1) {
          throw new Error("Demo error: Simulated connection failure");
        }
        result = {
          status: "success",
          data: {
            message: `${title} connection test passed (Demo Mode)`,
            timestamp: new Date().toISOString(),
            responseTime: `${Math.floor(delay)}ms`,
            statusCode: 200,
            demoMode: true
          }
        };
      } else {
        result = await testDataSourceConnection(connectionType, connectionData, connectionName);
      }
      setTestResponse(result);
      setConnectionError(null);
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionError(error.message || "Failed to test connection");
      setTestResponse(null);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Create connection
  const handleContinue = async () => {
    if (!testResponse || testResponse.status !== "success") return;
    setIsCreatingConnection(true);
    try {
      const connectionData = connectionDataBuilder ? connectionDataBuilder(formData) : formData;
      const connectionName = formData.name || generateName() || `${title} Connection`;
  console.log('[ConnectionPage] calling connectDataSource', { type: connectionType, name: connectionName });
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

  // Format dialog data
  const formatConnectionForDialog = (connection, type, testResult) => {
    const baseData = {
      name: connection.name,
      status: connection.status || 'connected',
      createdAt: connection.createdAt || new Date().toISOString(),
      testResult: testResult?.status === 'success' ? testResult.data : null,
      originalConnection: connection,
      isDemoMode: isDemoMode || connection.config?.isDemoMode
    };
    const formatters = {
      'custom-api': (conn) => ({
        ...baseData,
        title: `API Connection Created${isDemoMode ? ' (Demo)' : ''}`,
        message: `Your custom API connection has been successfully created${isDemoMode ? ' in demo mode' : ''} and is ready to use.`,
        details: [
          { label: "URL", value: conn.config?.url || formData.url },
          { label: "Type", value: "REST API" },
          { label: "Authentication", value: conn.config?.authentication || formData.authentication ? "Configured" : "None" },
          ...(isDemoMode ? [{ label: "Mode", value: "Demo" }] : [])
        ]
      }),
      'custom-ftp': (conn) => ({
        ...baseData,
        title: `FTP Connection Created${isDemoMode ? ' (Demo)' : ''}`,
        message: `Your FTP connection has been successfully created${isDemoMode ? ' in demo mode' : ''} and is ready to use.`,
        details: [
          { label: "Hostname", value: conn.config?.hostname || formData.hostname },
          { label: "Port", value: conn.config?.port || formData.port || "21" },
          { label: "Username", value: conn.config?.username || formData.username },
          { label: "Directory", value: conn.config?.directory || formData.directory || "/" },
          { label: "Protocol", value: conn.config?.keyFile || formData.keyFile ? "SFTP" : "FTP" },
          ...(isDemoMode ? [{ label: "Mode", value: "Demo" }] : [])
        ]
      }),
      'custom-mysql': (conn) => ({
        ...baseData,
        title: `MySQL Connection Created${isDemoMode ? ' (Demo)' : ''}`,
        message: `Your MySQL connection has been successfully created${isDemoMode ? ' in demo mode' : ''} and is ready to use.`,
        details: [
          { label: "Host", value: conn.config?.host || formData.host },
          { label: "Port", value: conn.config?.port || formData.port || "3306" },
          { label: "Username", value: conn.config?.username || formData.username },
          { label: "Database", value: conn.config?.database || formData.database },
          { label: "SSL", value: conn.config?.sslCA || formData.sslCA ? "Enabled" : "Disabled" },
          ...(isDemoMode ? [{ label: "Mode", value: "Demo" }] : [])
        ]
      })
    };
    const formatter = formatters[type];
    if (formatter) return formatter(connection);
    return {
      ...baseData,
      title: `Connection Created${isDemoMode ? ' (Demo)' : ''}`,
      message: `Your connection has been successfully created${isDemoMode ? ' in demo mode' : ''} and is ready to use.`,
      details: [
        { label: "Type", value: type },
        { label: "Name", value: connection.name },
        ...(isDemoMode ? [{ label: "Mode", value: "Demo" }] : [])
      ]
    };
  };

  // Navigation
  const navigateToDataManagement = (connectionData) => {
    const originalConnection = connectionData.originalConnection || connectionData;
    router.push({
      pathname: "/modules/day-book/data-management/data-management",
      params: {
        type: connectionType,
        connectionId: originalConnection.id,
        name: originalConnection.name,
        status: originalConnection.status,
        isDemoMode: isDemoMode.toString(),
        ...originalConnection
      },
    });
  };

  const handleDialogConfirm = () => {
    setShowSuccessDialog(false);
    navigateToDataManagement(connection);
  };

  // UI helpers
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
  const existingConnection = dataSources.find(source => source.type === connectionType);
  const isConnected = () => existingConnection?.status === 'connected';
  const testSectionStatus = getTestSectionStatus();
  const isLoading = isTestingConnection || isCreatingConnection;
  const hasError = adapterError;

  return (
    <View style={commonStyles.screen}>
      <Header title={title} showBack />
      <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
        <StackLayout spacing={0}>
          {hasError && (
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
          {isDemoMode && demoConfig.behavior.showDemoIndicators && (
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
                Using simulated data for development
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
                    isDemoMode={isDemoMode}
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
      <View style={commonStyles.floatingButtonContainer}>
        <BasicButton
          label={isCreatingConnection ? "Creating Connection..." : "Create Connection"}
          onPress={handleContinue}
          disabled={isLoading || !testResponse || testResponse.status !== "success"}
          fullWidth={false}
        />
      </View>
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
