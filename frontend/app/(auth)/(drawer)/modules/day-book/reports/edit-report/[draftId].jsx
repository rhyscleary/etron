// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef, useEffect, useMemo } from "react";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import RNFS from "react-native-fs";
import { Portal, Dialog, Button } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import endpoints from "../../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { apiGet } from "../../../../../../../utils/api/apiClient";
import { uploadUpdatedReport } from "../../../../../../../utils/reportUploader";
import { createNewTemplate } from "../../../../../../../utils/templateUploader"; 
import { useTheme } from "react-native-paper";

const EditReport = () => {
  const { draftId } = useLocalSearchParams();
  const router = useRouter();
  const [editorContent, setEditorContent] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [fileName, setFileName] = useState("Report");
  const [reportId, setReportId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const webViewRef = useRef(null);
  const initSentRef = useRef(false);
  const theme = useTheme();

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

  useEffect(() => {
    const fetchDraft = async () => {
      if (!draftId || !workspaceId) return;

      try {
        const response = await apiGet(
          endpoints.modules.day_book.reports.drafts.getDraft(draftId),
          { workspaceId }
        );

        if (!response) return;

        setReportId(response.draftId);
        setFileName(response.name || "Report");

        if (response.fileUrl) {
          const fileResponse = await fetch(response.fileUrl);
          const fileText = await fileResponse.text();
          setEditorContent(fileText || "");
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err);
      }
    };

    fetchDraft();
  }, [draftId, workspaceId]);

  const pellHtml = useMemo(() => {
    return `
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
          (function () {
            const editor = window.pell.init({
              element: document.getElementById('editor'),
              onChange: html => {
                try {
                  window.ReactNativeWebView.postMessage(html);
                } catch (e) {
                  window.postMessage(JSON.stringify({ type: 'edit', html }), '*');
                }
              },
              defaultParagraphSeparator: 'p',
              styleWithCSS: true
            });

            function setContent(html) {
              editor.content.innerHTML = html || '';
              try {
                const range = document.createRange();
                range.selectNodeContents(editor.content);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              } catch (err) {}
            }

            function receiveMessage(event) {
              let data = event && event.data;
              try {
                if (typeof data === 'string') {
                  data = JSON.parse(data);
                }
              } catch (e) {}
              if (!data) return;

              if (data.type === 'init' || data.type === 'load') {
                setContent(data.html || data.content || '');
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
                } catch (e) {
                  window.postMessage(JSON.stringify({ type: 'loaded' }), '*');
                }
              }
            }

            document.addEventListener('message', receiveMessage, false);
            window.addEventListener('message', receiveMessage, false);
            window.__setEditorContent = setContent;
          })();
        </script>
      </body>
    </html>
    `;
  }, []);

  const readOnlyHtml = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family:sans-serif; padding:12px; }
        </style>
      </head>
      <body>
        ${editorContent || "<p><i>No content</i></p>"}
      </body>
    </html>
    `;
  }, [editorContent]);

  const sendInitToWebView = (html) => {
    if (!webViewRef.current) return;
    try {
      webViewRef.current.postMessage(JSON.stringify({ type: 'init', html: html || '' }));
      initSentRef.current = true;
    } catch (err) {
      setTimeout(() => {
        try {
          webViewRef.current?.postMessage(JSON.stringify({ type: 'init', html: html || '' }));
          initSentRef.current = true;
        } catch (e) {
          console.warn("Failed to post init to WebView:", e);
        }
      }, 200);
    }
  };

  useEffect(() => {
    if (!isEditing) {
      initSentRef.current = false;
      return;
    }
    if (!initSentRef.current) {
      setTimeout(() => sendInitToWebView(editorContent), 120);
    }
  }, [isEditing, editorContent]);

  const handleWebViewLoadEnd = () => {
    if (isEditing && !initSentRef.current) {
      sendInitToWebView(editorContent);
    }
  };

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

  const handleSaveReport = async () => {
    if (!workspaceId || !draftId) {
      Alert.alert("Error", "Missing workspace or draft ID.");
      return;
    }

    const success = await uploadUpdatedReport({
      workspaceId,
      reportId: draftId,
      reportName: fileName,
      editorContent
    });

    if (success) {
      Alert.alert("Success", "Report updated successfully");
      setIsEditing(false);
      initSentRef.current = false;
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!workspaceId) {
      Alert.alert("Error", "Missing workspace ID.");
      return;
    }

    try {
      const newTemplateId = await createNewTemplate({
        workspaceId,
        templateName: fileName, // reusing report name as template name
      });

      if (newTemplateId) {
        Alert.alert("Success", "Template saved successfully");
        setIsEditing(false);
        initSentRef.current = false;
        router.push(`/modules/day-book/reports/templates/${newTemplateId}`);
      } else {
        Alert.alert("Error", "Failed to save template");
      }
    } catch (err) {
      console.error("Failed to save as template:", err);
      Alert.alert("Error", "Failed to save as template");
    }
  };

  return (
    <View style={[commonStyles.screen, { backgroundColor: theme.colors.background }]}>
      <Header
        title={reportId ? "Edit Report" : "New Report"}
        showBack={!isEditing}
        showCheck={isEditing}
        showEllipsis={!isEditing}   
        onRightIconPress={isEditing ? handleSaveReport : undefined}
      />

      {/* Buttons row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.exportButton} onPress={() => setDialogVisible(true)}>
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </TouchableOpacity>

        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}

        {isEditing && (
          <TouchableOpacity style={styles.saveTemplateButton} onPress={handleSaveAsTemplate}>
            <Text style={styles.saveTemplateButtonText}>Save as Template</Text>
          </TouchableOpacity>
        )}
      </View>

      <WebView
        key={isEditing ? "editor" : "viewer"}
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: isEditing ? pellHtml : readOnlyHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          if (!isEditing) return;
          try {
            const data = event.nativeEvent.data;
            try {
              const maybeJson = JSON.parse(data);
              if (maybeJson && maybeJson.type === 'loaded') {
                return;
              }
            } catch (e) {}
            setEditorContent(event.nativeEvent.data);
          } catch (err) {
            console.warn("Failed to process onMessage from WebView:", err);
          }
        }}
        onLoadEnd={handleWebViewLoadEnd}
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
  editButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginRight: 10,
  },
  editButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  saveTemplateButton: {
    backgroundColor: "#34C759",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveTemplateButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  webview: { flex: 1 },
  input: {
    borderWidth: 1, borderColor: "#ccc", padding: 8, marginTop: 10, borderRadius: 5,
  },
});

export default EditReport;
