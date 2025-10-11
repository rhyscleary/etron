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
import { createNewTemplate, uploadUpdatedTemplate } from "../../../../../../../utils/templateUploader";
import { useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import CustomBottomSheet from "../../../../../../../components/BottomSheet/bottom-sheet";

const EditReport = () => {
  const { draftId } = useLocalSearchParams();
  const router = useRouter();
  const [editorContent, setEditorContent] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [templateDialogVisible, setTemplateDialogVisible] = useState(false);
  const [fileName, setFileName] = useState("Report");
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [reportId, setReportId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const webViewRef = useRef(null);
  const initSentRef = useRef(false);
  const theme = useTheme();

  // Fetch workspace ID
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

  // Fetch draft
  useEffect(() => {
    const fetchDraft = async () => {
      if (!draftId || !workspaceId) return;

      try {
        const response = await apiGet(
          endpoints.modules.day_book.reports.drafts.getDraft(draftId),
          { workspaceId }
        );

        const draft = response.data;

        if (!draft) return;

        setReportId(draft.draftId);
        setFileName(draft.name || "Report");

        if (draft.fileUrl) {
          const fileResponse = await fetch(draft.fileUrl);
          const fileText = await fileResponse.text();
          setEditorContent(fileText || "");
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err);
      }
    };

    fetchDraft();
  }, [draftId, workspaceId]);

  // Editor HTML
  const pellHtml = useMemo(() => `
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
                try { window.ReactNativeWebView.postMessage(html); } catch (e) {}
              },
              defaultParagraphSeparator: 'p',
              styleWithCSS: true
            });

            function setContent(html) {
              editor.content.innerHTML = html || '';
              const range = document.createRange();
              range.selectNodeContents(editor.content);
              range.collapse(false);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            }

            function receiveMessage(event) {
              let data = event.data;
              try { data = JSON.parse(data); } catch (e) {}
              if (data?.type === 'init' || data?.type === 'load') setContent(data.html || data.content || '');
            }

            document.addEventListener('message', receiveMessage);
            window.addEventListener('message', receiveMessage);
          })();
        </script>
      </body>
    </html>
  `, []);

  // Read-only HTML
  const readOnlyHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;padding:12px;}</style></head>
      <body>${editorContent || "<p><i>No content</i></p>"}</body>
    </html>
  `, [editorContent]);

  // Initialize editor
  const sendInitToWebView = (html) => {
    if (!webViewRef.current) return;
    try {
      webViewRef.current.postMessage(JSON.stringify({ type: 'init', html: html || '' }));
      initSentRef.current = true;
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (isEditing && !initSentRef.current) {
      setTimeout(() => sendInitToWebView(editorContent), 120);
    }
  }, [isEditing, editorContent]);

  const handleWebViewLoadEnd = () => {
    if (isEditing && !initSentRef.current) sendInitToWebView(editorContent);
  };

  // Export PDF
  const exportAsPDF = async (customFileName) => {
    try {
      const file = await RNHTMLtoPDF.convert({
        html: editorContent || "<p>No content</p>",
        fileName: "temp_report",
        base64: false,
      });
      const destPath = `${Platform.OS === "android" ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath}/${customFileName}.pdf`;
      if (await RNFS.exists(destPath)) await RNFS.unlink(destPath);
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
    const success = await uploadUpdatedReport({ workspaceId, reportId: draftId, reportName: fileName, editorContent });
    if (success) {
      Alert.alert("Success", "Report updated successfully");
      setIsEditing(false);
      initSentRef.current = false;
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!workspaceId) return Alert.alert("Error", "Missing workspace ID.");
    setTemplateDialogVisible(true);
  };

  const confirmSaveTemplate = async () => {
    setTemplateDialogVisible(false);
    try {
      const newTemplateId = await createNewTemplate({ workspaceId, templateName });
      if (newTemplateId) {
        const success = await uploadUpdatedTemplate({ workspaceId, templateId: newTemplateId, templateName, editorContent });
        if (success) {
          Alert.alert("Success", "Template saved successfully");
          setIsEditing(false);
          initSentRef.current = false;
          router.push(`/modules/day-book/reports/edit-template/${newTemplateId}`);
        } else {
          Alert.alert("Error", "Template created but failed to upload content");
        }
      } else {
        Alert.alert("Error", "Failed to create template");
      }
    } catch (err) {
      console.error("Failed to save as template:", err);
      Alert.alert("Error", "Failed to save as template");
    }
  };

  const onHeaderEditPress = () => {
    if (isEditing) {
      handleSaveReport();
    } else {
      setIsEditing(true);
    }
  };

  const onHeaderEllipsisPress = () => {
    setSheetVisible(true);
  };

  return (
    <View style={[commonStyles.screen, { backgroundColor: theme.colors.background }]}>
      <Header
        title={reportId ? "Edit Report" : "New Report"}
        showBack
        showEdit={!isEditing}
        showCheck={isEditing}
        showEllipsis={true}
        onRightIconPress={onHeaderEditPress}
        onEllipsisPress={onHeaderEllipsisPress}
      />

      <WebView
        key={isEditing ? "editor" : "viewer"}
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: isEditing ? pellHtml : readOnlyHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          if (!isEditing) return;
          setEditorContent(event.nativeEvent.data);
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

      {/* Save as Template dialog */}
      <Portal>
        <Dialog visible={templateDialogVisible} onDismiss={() => setTemplateDialogVisible(false)}>
          <Dialog.Title>Save as Template</Dialog.Title>
          <Dialog.Content>
            <Text>Enter template name:</Text>
            <TextInput style={styles.input} value={templateName} onChangeText={setTemplateName} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTemplateDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmSaveTemplate}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Overlay for bottom sheet dismiss */}
      {sheetVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSheetVisible(false)}
        />
      )}

{/* Bottom sheet (always mounted, visibility controlled by prop) */}
            {/* Ellipsis-triggered Quick Actions Bottom Sheet */}
            {sheetVisible && (
                <CustomBottomSheet
                    variant="standard"
                    header={{
                        showClose: false,
                        solidBackground: true,
                    }}
                    search={{
                        enabled: false, // no search needed for this sheet
                    }}
                    footer={{
                        variant: "minimal",
                        placement: "right",
                    }}
                    onChange={(index) => {
                        if (index === -1) setSheetVisible(false);
                    }}
                    onClose={() => setSheetVisible(false)}
                    data={[
                        {
                            label: "Export as PDF",
                            onPress: () => {
                                setSheetVisible(false);
                                setDialogVisible(true);
                            },
                        },
                        {
                            label: "Save Report",
                            onPress: () => {
                                setSheetVisible(false);
                                handleSaveReport();
                            },
                        },
                        {
                            label: "Save as Template",
                            onPress: () => {
                                setSheetVisible(false);
                                handleSaveAsTemplate();
                            },
                        },
                    ]}
                    keyExtractor={(item) => item.label}
                    itemTitleExtractor={(item) => item.label}
                    onItemPress={(item) => {
                        setSheetVisible(false);
                        if (typeof item.onPress === "function") item.onPress();
                    }}
                />
            )}
    </View>
  );
};

const styles = StyleSheet.create({
  webview: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginTop: 10,
    borderRadius: 5,
  },
  sheetContent: {
    flexDirection: "column",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  sheetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  sheetText: { marginLeft: 12, fontSize: 16, color: "#333" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});

export default EditReport;
