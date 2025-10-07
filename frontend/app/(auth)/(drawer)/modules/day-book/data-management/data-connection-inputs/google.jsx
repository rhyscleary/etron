import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image } from "react-native";
import * as AuthSession from 'expo-auth-session';
import { apiGet, apiPost } from "../../../../../../../utils/api/apiClient";

const GOOGLE_CLIENT_ID = "<YOUR_GOOGLE_CLIENT_ID>";
const REDIRECT_URI = AuthSession.makeRedirectUri({ useProxy: true });

export default function Google({ workspaceId }) {
  const [linking, setLinking] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);

  // --------------------------
  // Configure Auth Request
  // --------------------------
  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly", "email", "profile"],
      responseType: "code",
      extraParams: { access_type: "offline", prompt: "consent" },
    },
    discovery
  );

  // --------------------------
  // Handle Auth Response
  // --------------------------
  useEffect(() => {
    const linkAccount = async () => {
      if (response?.type === "success" && response.params.code) {
        try {
          const code = response.params.code;
          const res = await apiPost("/integrations/google/link", { code });
          Alert.alert("Success!", res.message || "Google account linked.");
        } catch (err) {
          console.error("Error linking Google:", err);
          Alert.alert("Failed to link Google", err.message);
        } finally {
          setLinking(false);
        }
      }
    };

    linkAccount();
  }, [response]);

  // --------------------------
  // Link Google Button
  // --------------------------
  const handleLinkGoogle = async () => {
    setLinking(true);
    await promptAsync({ useProxy: true });
  };

  // --------------------------
  // Fetch Available Sheets
  // --------------------------
  const fetchSheets = async () => {
    setLoadingSheets(true);
    try {
      const res = await apiGet("/integrations/google/sheets");
      setSheets(res.data || []);
    } catch (err) {
      console.error("Failed fetching sheets:", err);
      Alert.alert("Error fetching sheets", err.message);
    } finally {
      setLoadingSheets(false);
    }
  };

  const addSheetAsDataSource = async (sheet) => {
    try {
      await apiPost("/day-book/data-sources/remote", {
        workspaceId,
        name: sheet.name,
        sourceType: "google_sheets",
        config: { spreadsheetId: sheet.id, range: "Sheet1!A:Z" },
      });
      Alert.alert("Success!", "Sheet added as a remote data source.");
      setSelectedSheet(sheet);
    } catch (err) {
      console.error("Failed adding sheet:", err);
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Sheets Integration</Text>

      <Button title="Link Google Account" onPress={handleLinkGoogle} disabled={linking} />

      <View style={{ height: 16 }} />

      <Button title="Fetch Available Sheets" onPress={fetchSheets} disabled={loadingSheets} />
      {loadingSheets && <ActivityIndicator style={{ marginTop: 10 }} />}

      <FlatList
        data={sheets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.sheetItem} onPress={() => addSheetAsDataSource(item)}>
            {item.thumbnail && <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />}
            <View>
              <Text style={styles.sheetName}>{item.name}</Text>
              <Text style={styles.sheetId}>{item.id}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  sheetItem: { flexDirection: "row", alignItems: "center", padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  thumbnail: { width: 50, height: 50, marginRight: 10 },
  sheetName: { fontSize: 16, fontWeight: "500" },
  sheetId: { fontSize: 12, color: "#666" },
});
