// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useEffect, useRef } from "react";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import { useLocalSearchParams } from "expo-router";
import { apiGet, apiPut } from "../../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../../utils/api/endpoints";

const EditReport = () => {
  const { draftId } = useLocalSearchParams();
  const [editorContent, setEditorContent] = useState("");
  const [report, setReport] = useState(null);
  const webViewRef = useRef(null);

  // Fetch report metadata + existing HTML content
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await apiGet(
          endpoints.modules.day_book.reports.getDraft(draftId)
        );
        setReport(result);

        if (result?.content) {
          // Injects saved HTML into the editor
          const escapedContent = result.content.replace(/`/g, "\\`"); // escape backticks
          const jsToInject = `
            if (window.editor) {
              editor.content.innerHTML = \`${escapedContent}\`;
            }
          `;
          webViewRef.current?.injectJavaScript(jsToInject);
          setEditorContent(result.content);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        Alert.alert("Error", "Could not load report.");
      }
    };
    fetchReport();
  }, [draftId]);

  // Save report
  const saveReport = async () => {
    try {
      await apiPut(
        endpoints.modules.day_book.reports.updateDraft(draftId),
        {
          ...report,
          content: editorContent,
          lastEdited: new Date().toISOString(),
        }
      );
      Alert.alert("Success", "Report saved successfully!");
    } catch (err) {
      console.error("Error saving report:", err);
      Alert.alert("Error", "Failed to save report.");
    }
  };

  // HTML editor for WebView
  const editorHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/pell/dist/pell.min.css">
        <style>
          html, body { margin: 0; padding: 0; height: 100%; }
          .pell { height: 100%; display: flex; flex-direction: column; }
          .pell-actionbar { flex-shrink: 0; }
          .pell-content { flex: 1; overflow-y: auto; padding: 10px; }
        </style>
      </head>
      <body>
        <div id="editor" class="pell"></div>
        <script src="https://unpkg.com/pell"></script>
        <script>
          window.editor = window.pell.init({
            element: document.getElementById('editor'),
            onChange: html => window.ReactNativeWebView.postMessage(html),
            defaultParagraphSeparator: 'p',
            styleWithCSS: true
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={commonStyles.screen}>
      <Header title={report?.name || "Edit Report"} showBack />

      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: editorHtml }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          setEditorContent(event.nativeEvent.data);
        }}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={saveReport}>
          <Text style={styles.buttonText}>💾 Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EditReport;
