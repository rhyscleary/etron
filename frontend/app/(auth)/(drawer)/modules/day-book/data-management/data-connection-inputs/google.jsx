import React, { useState } from "react";
import { View, Text, Button, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import * as AuthSession from "expo-auth-session";
import { apiGet, apiPost } from "../../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../../utils/api/endpoints";

export default function Google({ workspaceId }) {
  const [linking, setLinking] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);

  // Step 1: Link Google account via backend
  const linkGoogleAccount = async () => {
    setLinking(true);
    try {
      // 1️⃣ Start OAuth flow with Google
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const clientId = process.env.GOOGLE_CLIENT_ID;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile`;

      const result = await AuthSession.startAsync({ authUrl });

      if (result.type !== "success" || !result.params.code) {
        throw new Error("Google sign-in cancelled or failed");
      }

      const code = result.params.code;

      // 2️⃣ Send code to backend to exchange tokens and link account
      const res = await apiPost(endpoints.modules.day_book.data_sources.integrations.google.link, { code });
      Alert.alert("Google linked!", `Linked to workspace successfully: ${res.userId}`);
    } catch (err) {
      console.error("Error linking Google:", err);
      Alert.alert("Failed to link Google account", err.message);
    } finally {
      setLinking(false);
    }
  };

  // Step 2: Fetch available sheets using backend-stored tokens
  const fetchSheets = async () => {
    setLoadingSheets(true);
    try {
      const response = await apiGet(endpoints.modules.day_book.data_sources.getAvailableSheets, {
        workspaceId
      });
      setSheets(response.data || []);
    } catch (err) {
      console.error("Error fetching sheets:", err);
      Alert.alert("Failed to fetch sheets", err.message);
    } finally {
      setLoadingSheets(false);
    }
  };

  // Step 3: Select a sheet and create remote data source
  const selectSheet = async (sheet) => {
    setSelectedSheet(sheet);
    try {
      const body = {
        workspaceId,
        name: sheet.name,
        sourceType: "google_sheets",
        config: { spreadsheetId: sheet.id, range: "Sheet1!A:Z" },
      };
      await apiPost(endpoints.modules.day_book.data_sources.addRemote, body);
      Alert.alert("Success!", "Google Sheet added as a remote data source.");
    } catch (err) {
      console.error("Error creating remote data source:", err);
      Alert.alert("Failed to add sheet", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Sheets Integration</Text>

      <Button
        title={linking ? "Linking..." : "Link Google Account"}
        onPress={linkGoogleAccount}
        disabled={linking}
      />

      <View style={{ height: 12 }} />

      <Button
        title="Fetch Available Sheets"
        onPress={fetchSheets}
        disabled={loadingSheets}
      />

      {loadingSheets && <ActivityIndicator style={{ marginTop: 10 }} />}

      <FlatList
        data={sheets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.sheetItem} onPress={() => selectSheet(item)}>
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
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  thumbnail: { width: 50, height: 50, marginRight: 10 },
  sheetName: { fontSize: 16, fontWeight: "500" },
  sheetId: { fontSize: 12, color: "#666" },
});


