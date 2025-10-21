// Author(s): Holly Wyatt

/*import React from "react";
import ConnectionDataSourceLayout from "../../../../../../../components/layout/ConnectionDataSourceLayout";

const Excel = () => {
    const getItemDescription = (dataSource, formatDate) => {
        return `Status: ${dataSource.status} • Last Modified: ${formatDate(dataSource.lastModified)}`;
    };

    const getItemIcon = () => "microsoft-excel";

    return (
        <ConnectionDataSourceLayout
            title="Excel"
            adapterType="microsoft-excel"
            serviceDisplayName="Microsoft Excel"
            getItemDescription={getItemDescription}
            getItemIcon={getItemIcon}
            showLocationFilter={false}
            searchPlaceholder="Search Excel connections"
            emptyStateMessage="No Excel connections found"
            demoModeMessage="Using sample Excel files for development"
            enablePersistentConnection={true}
            dataSourceName="My Excel Connection"
            dataManagementPath="/modules/day-book/data-management"
        />
    );
};

export default Excel;*/

import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import { authorize, refresh } from "react-native-app-auth";
import { apiPost } from "../../../../../../../utils/api/apiClient";

// --------------------------
// Microsoft OAuth Settings
// --------------------------
const MICROSOFT_CLIENT_ID = "5b73dcf5-fc09-47fb-933e-a58eb9d1f258";
const MICROSOFT_TENANT_ID = "bacabe25-4b37-4686-b4ff-eb5fe4a61be4";

const config = {
  issuer: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/v2.0`,
  clientId: MICROSOFT_CLIENT_ID,
  redirectUrl: "com.etron://oauth", // 👈 must match AndroidManifest.xml <data android:scheme="com.example.myapp" android:host="oauth" />
  scopes: [
    "openid",
    "profile",
    "email",
    "offline_access",
    "Files.Read",
    "Files.ReadWrite",
    "User.Read",
  ],
  additionalParameters: { prompt: "select_account" },
  serviceConfiguration: {
    authorizationEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
  },
};

export default function Excel({ workspaceId }) {
  const [linking, setLinking] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [authState, setAuthState] = useState(null);

  // --------------------------
  // Link Microsoft Account
  // --------------------------
  const linkMicrosoftAccount = async () => {
    try {
      setLinking(true);

      const result = await authorize(config);
      if (result && result.accessToken) {
        setAuthState(result);
        Alert.alert("Success!", "Microsoft account linked.");
        // Optionally send to backend
        // await apiPost("/integrations/microsoft/link", { accessToken: result.accessToken, workspaceId });
      } else {
        Alert.alert("Error", "Failed to obtain access token.");
      }
    } catch (err) {
      console.error("Microsoft Sign-In Error:", err);
      Alert.alert("Error", "Failed to link Microsoft account.");
    } finally {
      setLinking(false);
    }
  };

  // --------------------------
  // Refresh Token (optional)
  // --------------------------
  const refreshAccessToken = async () => {
    if (!authState?.refreshToken) return;
    try {
      const refreshed = await refresh(config, {
        refreshToken: authState.refreshToken,
      });
      setAuthState(refreshed);
    } catch (err) {
      console.error("Token refresh failed:", err);
    }
  };

  // --------------------------
  // Fetch Excel Workbooks
  // --------------------------
  const fetchExcelFiles = async () => {
    if (!authState?.accessToken) {
      Alert.alert("Not linked", "Please link your Microsoft account first.");
      return;
    }

    setLoadingFiles(true);
    try {
      const response = await fetch(
        "https://graph.microsoft.com/v1.0/me/drive/root/children",
        {
          headers: { Authorization: `Bearer ${authState.accessToken}` },
        }
      );

      const data = await response.json();
      const excelFiles = (data.value || []).filter(
        (file) => file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
      );

      setFiles(excelFiles);
    } catch (err) {
      console.error("Error fetching Excel files:", err);
      Alert.alert("Error", "Failed to fetch Excel files.");
    } finally {
      setLoadingFiles(false);
    }
  };

  // --------------------------
  // Add Excel as Data Source
  // --------------------------
  const addExcelAsDataSource = async (file) => {
    try {
      await apiPost("/day-book/data-sources/remote", {
        workspaceId,
        name: file.name,
        sourceType: "microsoft_excel",
        config: { fileId: file.id, downloadUrl: file["@microsoft.graph.downloadUrl"] },
      });

      Alert.alert("Success!", "Excel file added as a remote data source.");
      setSelectedFile(file);
    } catch (err) {
      console.error("Failed adding file:", err);
      Alert.alert("Error", err.message);
    }
  };

  // --------------------------
  // Render UI
  // --------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Microsoft Excel Integration</Text>

      <Button
        title="Link Microsoft Account"
        onPress={linkMicrosoftAccount}
        disabled={linking}
      />
      {linking && <ActivityIndicator style={{ marginTop: 10 }} />}

      <View style={{ height: 16 }} />

      <Button
        title="Fetch Excel Files"
        onPress={fetchExcelFiles}
        disabled={loadingFiles}
      />
      {loadingFiles && <ActivityIndicator style={{ marginTop: 10 }} />}

      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.fileItem}
            onPress={() => addExcelAsDataSource(item)}
          >
            <Image
              source={{
                uri:
                  item.thumbnails?.[0]?.medium?.url ||
                  "https://upload.wikimedia.org/wikipedia/commons/7/7f/Microsoft_Office_Excel_%282019–present%29.svg",
              }}
              style={styles.thumbnail}
            />
            <View>
              <Text style={styles.fileName}>{item.name}</Text>
              <Text style={styles.fileId}>{item.id}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// --------------------------
// Styles
// --------------------------
const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  thumbnail: { width: 50, height: 50, marginRight: 10 },
  fileName: { fontSize: 16, fontWeight: "500" },
  fileId: { fontSize: 12, color: "#666" },
});
