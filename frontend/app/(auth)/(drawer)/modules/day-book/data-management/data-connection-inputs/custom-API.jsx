import { View } from "react-native";
import { ScrollView } from "react-native";
import { useTheme, Text } from "react-native-paper";
import { router } from "expo-router";
import { useState, useEffect, useMemo } from "react";

// Components
import Header from "../../../../../../../components/layout/Header";
import StackLayout from "../../../../../../../components/layout/StackLayout";
import BasicButton from "../../../../../../../components/common/buttons/BasicButton";
import IconButton from "../../../../../../../components/common/buttons/IconButton";
import TestResultCard from "../../../../../../../components/cards/testResultCard";
import ConnectionDialog from "../../../../../../../components/overlays/ConnectionDialog";
import CollapsibleList from "../../../../../../../components/layout/CollapsibleList";
import FormSection from "../../../../../../../components/layout/FormSection";

// Styles and Utils
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import Divider from "../../../../../../../components/layout/Divider";

// Constants
const FAKE_SUCCESS_RATE = 0.8;
const TEST_DELAY = 2000;
const CONNECTION_DELAY = 1500;

// Utility Functions
const generateApiNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const name = urlObj.hostname.replace('www.', '').replace(/\./g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1) + ' API';
  } catch (error) {
    console.log("Invalid url, cannot generate name: ", error);
    return "";
  }
};

const validateUrl = (url) => {
  if (!url.trim()) return "API URL is required";
  
  try {
    new URL(url);
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return "URL must start with http:// or https://";
    }
    return null;
  } catch {
    return "Please enter a valid URL";
  }
};

const validateHeaders = (headers) => {
  if (!headers.trim()) return null;
  
  try {
    JSON.parse(headers);
    return null;
  } catch {
    return "Headers must be valid JSON format";
  }
};

// fake API Functions (TODO: Replace with real API calls)
const fakeTestConnection = async (url, headers, authentication) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isSuccess = Math.random() > (1 - FAKE_SUCCESS_RATE);
      
      if (isSuccess) {
        resolve({
          status: "success",
          responseTime: "245ms",
          statusCode: 200,
          contentType: "application/json",
          sampleData: {
            message: "API connection successful",
            timestamp: new Date().toISOString(),
            endpoints: ["/users", "/products", "/orders"]
          }
        });
      } else {
        reject(new Error("Connection failed: Unable to reach the API endpoint"));
      }
    }, TEST_DELAY);
  });
};

const fakeCreateConnection = async (apiName, url, headers, authentication, testResult) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `api_${Date.now()}`,
        name: apiName.trim(),
        url: url.trim(),
        status: "active",
        createdAt: new Date().toISOString(),
        lastTested: new Date().toISOString(),
        testResult
      });
    }, CONNECTION_DELAY);
  });
};

// Sub-components
const TestConnectionSection = ({ 
  isTestingConnection, testResponse, connectionError, 
  onTestConnection, url, apiName, theme 
}) => (
  <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
    <StackLayout spacing={15}>
      <Text style={[commonStyles.captionText, { color: theme.colors.onSurfaceVariant }]}>
        Test your API connection before creating it to ensure everything works correctly.
      </Text>
      
      <IconButton
        label={isTestingConnection ? "Testing..." : "Test Connection"}
        icon="connection"
        onPress={onTestConnection}
        loading={isTestingConnection}
        disabled={!url.trim() || !apiName.trim()}
      />
      
      {testResponse && (
        <>
            <Divider color={theme.colors.buttonBackground}/>
            <TestResultCard 
              result={testResponse} 
              showConnectionButton={true}
            />
        </>
      )}
      
      {connectionError && (
        <>
            <Divider color={theme.colors.buttonBackground}/>
            <TestResultCard 
              error={connectionError} 
              showConnectionButton={true}
              onConnectionPress={onTestConnection}
            />
        </>
      )}
    </StackLayout>
  </View>
);

// Main Component
const CustomAPI = () => {
  const theme = useTheme();

  // Form State
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("");
  const [authentication, setAuthentication] = useState("");
  const [apiName, setApiName] = useState("");
  const [urlFocused, setUrlFocused] = useState(false);
  const [errors, setErrors] = useState({});

  // Connection State
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Testing State
  const [testResponse, setTestResponse] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Modal State
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Auto-generate API name from URL
  useEffect(() => {
    if (url && !apiName && !urlFocused) {
      const generatedName = generateApiNameFromUrl(url);
      if (generatedName) {
        setApiName(generatedName);
      }
    }
  }, [url, urlFocused, apiName]);

  // Form validation
  const formIsValid = useMemo(() => {
    const urlError = validateUrl(url);
    const apiNameError = !apiName.trim() ? "API name is required" : null;
    const headersError = validateHeaders(headers);
    return !urlError && !apiNameError && !headersError;
  }, [url, apiName, headers]);

  const validateForm = () => {
    const newErrors = {};
    const urlError = validateUrl(url);
    if (urlError) newErrors.url = urlError;

    if (!apiName.trim()) {
      newErrors.apiName = "API name is required";
    }

    const headersError = validateHeaders(headers);
    if (headersError) newErrors.headers = headersError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setIsTestingConnection(true);
    setConnectionError(null);
    setTestResponse(null);

    try {
      // TODO: Replace with real API call
      // const response = await apiPost(endpoints.connections.customAPI.test(url.trim(), headers.trim(), authentication.trim()));
      
      const result = await fakeTestConnection(url.trim(), headers.trim(), authentication.trim());
      setTestResponse(result);
      setConnectionError(null);
      
    } catch (error) {
      console.error('Error testing API connection:', error);
      const errorMsg = error.message || "Failed to test API connection";
      setConnectionError(errorMsg);
      setTestResponse(null);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const createConnection = async () => {
    try {
      // TODO: Replace with real API call
      // const response = await apiPost(endpoints.connections.customAPI.create(...));
      
      const newConnection = await fakeCreateConnection(
        apiName.trim(), 
        url.trim(), 
        headers.trim(), 
        authentication.trim(),
        testResponse
      );
      
      setConnection(newConnection);
      setIsConnected(true);
      return newConnection;
      
    } catch (error) {
      console.error('Error creating API connection:', error);
      const errorMsg = error.message || "Failed to create API connection";
      setConnectionError(errorMsg);
      throw error;
    }
  };

  const handleContinue = async () => {
    if (!testResponse || testResponse.status !== "success") return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      let connectionToUse = connection;
      
      if (!isConnected) {
        connectionToUse = await createConnection();
        setShowSuccessDialog(true);
      } else {
        // Already connected, navigate directly
        navigateToDataManagement(connectionToUse);
      }
    } catch (error) {
      // Error handling is done in createConnection
    } finally {
      setIsConnecting(false);
    }
  };

  const navigateToDataManagement = (connectionData) => {
    router.push({
      pathname: "/modules/day-book/data-management/data-management",
      params: {
        type: "custom-api",
        connectionId: connectionData.id,
        name: connectionData.name,
        url: connectionData.url,
        status: connectionData.status,
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
    return { description: "Test your API connection", icon: "wifi-sync" };
  };

  const testSectionStatus = getTestSectionStatus();

  return (
    <View style={commonStyles.screen}>
      <Header title="Custom API" showBack />
      
      <ScrollView contentContainerStyle={commonStyles.scrollableContentContainer}>
        <StackLayout spacing={0}>
          <CollapsibleList
            canCloseFormAccordion={formIsValid}
            pointerEvents={formIsValid ? "auto" : "none"}
            items={[
              {
                key: "form",
                title: "API Configuration",
                description: apiName ? `${apiName} • ${url}` : "Configure your API connection",
                icon: "web",
                defaultExpanded: true,
                disabled: false,
                content: (
                  <FormSection
                    apiName={apiName}
                    setApiName={setApiName}
                    url={url}
                    setUrl={setUrl}
                    headers={headers}
                    setHeaders={setHeaders}
                    authentication={authentication}
                    setAuthentication={setAuthentication}
                    errors={errors}
                    isConnected={isConnected}
                    onUrlFocus={() => setUrlFocused(true)}
                    onUrlBlur={() => setUrlFocused(false)}
                    theme={theme}
                  />
                ),
              },
              {
                key: "test",
                title: "Test Connection",
                description: testSectionStatus.description,
                icon: testSectionStatus.icon,
                defaultExpanded: url.trim() && apiName.trim() && !isConnected,
                disabled: !url.trim() || !apiName.trim() || isConnected,
                content: (
                  <TestConnectionSection
                    isTestingConnection={isTestingConnection}
                    testResponse={testResponse}
                    connectionError={connectionError}
                    onTestConnection={handleTestConnection}
                    url={url}
                    apiName={apiName}
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
          label={isConnecting ? "Creating Connection..." : "Create Connection"}
          onPress={handleContinue}
          disabled={isConnecting || !testResponse || testResponse.status !== "success"}
          fullWidth={false}
        />
      </View>
      
      {/* Modals */}
      <ConnectionDialog
        visible={showSuccessDialog}
        onDismiss={() => setShowSuccessDialog(false)}
        onConfirm={handleDialogConfirm}
        connection={connection}
      />
    </View>
  );
};

export default CustomAPI;