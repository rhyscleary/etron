// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef, useEffect, useMemo } from "react";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import RNFS from "react-native-fs";
import { Portal, Dialog, Button } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import endpoints from "../../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { apiGet } from "../../../../../../../utils/api/apiClient";
import { uploadUpdatedReport } from "../../../../../../../utils/reportUploader";

const EditReport = () => {
  const { draftId } = useLocalSearchParams();
  const [editorContent, setEditorContent] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [fileName, setFileName] = useState("Report");
  const [reportId, setReportId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const webViewRef = useRef(null);
  // track whether we've sent initial content to the webview to avoid repeated sends
  const initSentRef = useRef(false);

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

  /*
    Important note about the editor and the typing bug:
    - Previously we injected `editorContent` into the editor HTML string directly.
    - That caused the WebView's source to change on every keystroke (because state updated),
      which reinitialized Pell and kicked focus out of the editor.
    - Fix: keep the Pell HTML static (don't embed editorContent into the source).
      Send the current HTML into the WebView via postMessage only once when entering edit mode
      (or when the webview finishes loading). The webview receives the message and sets the editor content.
    - While editing the editor will post messages to React Native on every change; we update editorContent
      in state, but since we are not re-rendering the WebView source with that value, Pell stays mounted
      and focus is preserved while typing.
  */

  // Edit mode HTML: static template (no editorContent embedded)
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
            // initialize Pell editor once
            const editor = window.pell.init({
              element: document.getElementById('editor'),
              onChange: html => {
                // send html back to React Native
                try {
                  window.ReactNativeWebView.postMessage(html);
                } catch (e) {
                  // fallback for older RN WebView bridges
                  window.postMessage(JSON.stringify({ type: 'edit', html }), '*');
                }
              },
              defaultParagraphSeparator: 'p',
              styleWithCSS: true
            });

            // function to set content (used when React Native sends initial HTML)
            function setContent(html) {
              editor.content.innerHTML = html || '';
              // move caret to end (so user can continue typing)
              try {
                const range = document.createRange();
                range.selectNodeContents(editor.content);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              } catch (err) {
                // ignore if selection APIs aren't available
              }
            }

            // receive messages from React Native
            function receiveMessage(event) {
              let data = event && event.data;
              try {
                if (typeof data === 'string') {
                  // some bridges send raw stringified JSON
                  data = JSON.parse(data);
                }
              } catch (e) {
                // if parsing fails, treat data as plain string content
              }

              if (!data) return;

              if (data.type === 'init' || data.type === 'load') {
                setContent(data.html || data.content || '');
                // notify RN we've loaded the content
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
                } catch (e) {
                  window.postMessage(JSON.stringify({ type: 'loaded' }), '*');
                }
              }
            }

            // multiple event listeners for compatibility
            document.addEventListener('message', receiveMessage, false);
            window.addEventListener('message', receiveMessage, false);

            // expose setContent for debugging if needed
            window.__setEditorContent = setContent;
          })();
        </script>
      </body>
    </html>
    `;
  }, []); // static, do not rebuild on editorContent changes

  // Read only HTML (we do embed editorContent here because read-only mode does not reinitialize Pell)
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

  // Helper to send the current HTML into the WebView editor only when needed
  const sendInitToWebView = (html) => {
    if (!webViewRef.current) return;
    try {
      webViewRef.current.postMessage(JSON.stringify({ type: 'init', html: html || '' }));
      initSentRef.current = true;
    } catch (err) {
      // sometimes postMessage may throw if the webview isn't ready; try again shortly
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

  // When we enter edit mode, send the latest editorContent into the webview
  useEffect(() => {
    if (!isEditing) {
      // reset initSentRef so next time we enter edit mode it will send again
      initSentRef.current = false;
      return;
    }

    // If already sent for this content, skip; otherwise send.
    if (!initSentRef.current) {
      // give the webview a moment to mount
      setTimeout(() => sendInitToWebView(editorContent), 120);
    }
  }, [isEditing, editorContent]);

  // onLoadEnd handler to ensure the webview gets the initial content when it finishes loading
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
      setIsEditing(false); // exits edit mode after saving
      // reset initSentRef so next time entering edit mode we will re-send content
      initSentRef.current = false;
    }
  };

  return (
    <View style={commonStyles.screen}>
      <Header
        title={reportId ? "Edit Report" : "New Report"}
        showBack
        showCheck={isEditing}
        showEllipsis
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
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
            <Text style={styles.saveButtonText}>{reportId ? "Update" : "Save"} Report</Text>
          </TouchableOpacity>
        )}
      </View>

      <WebView
        // key toggles so WebView reloads when switching modes (ensures correct HTML template)
        key={isEditing ? "editor" : "viewer"}
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: isEditing ? pellHtml : readOnlyHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          // Pell sends plain HTML string on change. Only update state (do NOT re-inject into WebView).
          if (!isEditing) return;
          try {
            // If message is JSON (e.g. our 'loaded' message), handle accordingly
            const data = event.nativeEvent.data;
            // detect our loaded message optionally
            try {
              const maybeJson = JSON.parse(data);
              if (maybeJson && maybeJson.type === 'loaded') {
                // ignore or use as a hook if needed
                return;
              }
            } catch (e) {
              // not JSON - that's likely the HTML content
            }
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
  },
  editButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
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
