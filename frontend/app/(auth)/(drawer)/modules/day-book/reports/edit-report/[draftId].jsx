// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef, useEffect } from "react";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import RNFS from "react-native-fs";
import { Portal, Dialog, Button } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import endpoints from "../../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { apiPut, apiGet } from "../../../../../../../utils/api/apiClient";

const EditReport = () => {
  const { draftId } = useLocalSearchParams();
  const [editorContent, setEditorContent] = useState(""); 
  const [dialogVisible, setDialogVisible] = useState(false);
  const [fileName, setFileName] = useState("Report");
  const [reportId, setReportId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    const fetchWorkspaceId = async () => {
      try {
        const id = await getWorkspaceId();
        setWorkspaceId(id);
      } catch (err) {
        console.error("Failed to fetch workspace ID:", err);
      }
    };
    fetchWorkspaceId();
  }, []);

  // If draftId is not "new", fetch existing draft metadata and file
  useEffect(() => {
    const fetchDraft = async () => {
      if (!draftId || !workspaceId) return;
      
      try {
        console.log("Fetching draft metadata for:", draftId, "workspaceId:", workspaceId);

        const response = await apiGet(
          endpoints.modules.day_book.reports.drafts.getDraft(draftId), 
          workspaceId
        );
        const data = await response.json();
        console.log("Draft metadata response:", data);

        if (!data) return;

        setReportId(data.draftId);
        setFileName(data.name || "Report");

        if (data.fileUrl) {
          console.log("Fetching HTML file from fileUrl:", data.fileUrl);
          const fileResponse = await fetch(data.fileUrl);
          const fileText = await fileResponse.text();
          console.log("Fetched HTML content length:", fileText.length);

          setEditorContent(fileText);

          // Inject into Pell editor
          webViewRef.current?.injectJavaScript(`
            document.querySelector(".pell-content").innerHTML = ${JSON.stringify(fileText)};
            true;
          `);
        } else {
          console.warn("No fileUrl found in draft data");
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err);
      }
    };

    fetchDraft();
  }, [draftId, workspaceId]);

  const pellHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/pell/dist/pell.min.css">
        <style>
          html, body { margin:0; padding:0; height:100%; width:100%; font-family:sans-serif; display:flex; flex-direction:column; }
          .pell { display:flex; flex-direction:column; height:100%; width:100%; }
          .pell-actionbar { position:sticky; top:0; background:#fff; border-bottom:1px solid #ccc; padding:6px; overflow-x:auto; white-space:nowrap; }
          .pell-button { font-size:20px; min-width:40px; min-height:40px; margin-right:6px; }
          .pell-content { flex:1; width:100%; overflow-y:auto; padding:10px; box-sizing:border-box; }
        </style>
      </head>
      <body>
        <div id="editor" class="pell"></div>
        <script src="https://unpkg.com/pell"></script>
        <script>
          const editor = window.pell.init({
            element: document.getElementById('editor'),
            onChange: html => window.ReactNativeWebView.postMessage(html),
            defaultParagraphSeparator: 'p',
            styleWithCSS: true
          });
        </script>
      </body>
    </html>
  `;

  const exportAsPDF = async (customFileName) => {
    try {
      const file = await RNHTMLtoPDF.convert({
        html: editorContent || "<p>No content</p>",
        fileName: "temp_report",
        base64: false,
      });

      const downloadDir =
        Platform.OS === "android"
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;

      const destPath = `${downloadDir}/${customFileName}.pdf`;

      if (await RNFS.exists(destPath)) {
        await RNFS.unlink(destPath);
      }
      await RNFS.moveFile(file.filePath, destPath);

      Alert.alert("Export Successful", `PDF saved to:\n${destPath}`);
    } catch (err) {
      console.error("PDF export failed:", err);
      Alert.alert("Error", "Could not export PDF.");
    }
  };

  const handleExport = () => {
    setDialogVisible(false);
    exportAsPDF(fileName.trim() || "Report");
  };

  // Save (PUT) report draft
  const saveReport = async () => {
    if (!workspaceId || !reportId) {
      Alert.alert("Error", "Missing workspace or draft ID.");
      console.log("Workspace Id or draftId missing", workspaceId, reportId)
      return;
    }

    try {
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName.trim() || "Report"}.html`;
      await RNFS.writeFile(filePath, editorContent || "<p>No content</p>", "utf8");

      const formData = new FormData();
      formData.append("workspaceId", workspaceId);
      formData.append("name", fileName.trim() || "Report");
      formData.append("file", {
        uri: Platform.OS === "android" ? `file://${filePath}` : filePath,
        type: "text/html",
        name: `${fileName.trim() || "Report"}.html`,
      });

      console.log("Saving draft with formData:", formData);

      const response = await apiPut(endpoints.modules.day_book.reports.drafts.updateDraft(reportId), {
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const result = await response.json();
      console.log("Update result:", result);

      Alert.alert("Success", "Report updated successfully.");
    } catch (err) {
      console.error("Report update failed:", err);
      Alert.alert("Error", "Could not update report.");
    }
  };

  return (
    <View style={commonStyles.screen}>
      <Header title={reportId ? "Edit Report" : "New Report"} showBack />

      {/* Buttons row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.exportButton} onPress={() => setDialogVisible(true)}>
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveReport}>
          <Text style={styles.saveButtonText}>{reportId ? "Update" : "Save"} Report</Text>
        </TouchableOpacity>
      </View>

      {/* Pell / Rich Text editor */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: pellHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => setEditorContent(event.nativeEvent.data)}
      />

      {/* Export dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Export PDF</Dialog.Title>
          <Dialog.Content>
            <Text>Enter file name:</Text>
            <TextInput style={styles.input} value={fileName} onChangeText={setFileName} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleExport}>Export</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  exportButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginRight: 10,
  },
  exportButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  saveButton: {
    backgroundColor: "#34C759",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  webview: { flex: 1 },
  input: {
    borderWidth: 1, borderColor: "#ccc", padding: 8, marginTop: 10, borderRadius: 5,
  },
});

export default EditReport;
