import React, { useEffect, useState } from "react";
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
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { apiGet, apiPost } from "../../../../../../../utils/api/apiClient";

const GOOGLE_WEB_CLIENT_ID =
  "50734582647-ll5a03cudvfqhi8jhooco2j7pvddbf6s.apps.googleusercontent.com";
const IOS_CLIENT_ID =
  "50734582647-5scgmeadfvempp7l78ul9kk7rajess5o.apps.googleusercontent.com";

export default function Google({ workspaceId }) {
  const [linking, setLinking] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);

  // --------------------------
  // Configure Google Sign-In
  // --------------------------
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "email",
        "profile",
      ],
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  // --------------------------
  // Link Google Account
  // --------------------------
  const handleLinkGoogle = async () => {
    try {
      setLinking(true);
      try {
        await GoogleSignin.hasPlayServices();
          // google services are available
      } catch (err) {
        console.error('play services are not available');
      }

      //await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;
        const { name, email } = user;
        console.log(name + " " + email);
      } else {
        console.log("Failed.");
      }
      //const tokens = await GoogleSignin.getTokens();

      // Send the access token to your backend
      /*const res = await apiPost("/integrations/google/link", {
        accessToken: tokens.accessToken,
        workspaceId,
      });

      Alert.alert("Success!", res.message || "Google account linked.");*/
    } catch (err) {
      if (isErrorWithCode(err)) {
        console.log(err.code);
      }
      console.error("Google Sign-In Error:", err);
      Alert.alert("Failed to link Google", err.message);
    } finally {
      setLinking(false);
    }
  };

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        console.log({ userInfo: response.data });
      } else {
        // sign in was cancelled by user
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            console.log("in progress");
            // operation (eg. sign in) already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log("play services unavailable");
            // Android only, play services not available or outdated
            break;
          default:
            console.log(error);
          // some other error happened
        }
      } else {
        // an error that's not related to google sign in occurred
      }
    }
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

  // --------------------------
  // Add Sheet as Data Source
  // --------------------------
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

  // --------------------------
  // Render UI
  // --------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Sheets Integration</Text>

      <Button
        title="Link Google Account"
        onPress={signIn}
        disabled={linking}
      />
      {linking && <ActivityIndicator style={{ marginTop: 10 }} />}

      <View style={{ height: 16 }} />

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
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => addSheetAsDataSource(item)}
          >
            {item.thumbnail && (
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            )}
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

// --------------------------
// Styles
// --------------------------
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
