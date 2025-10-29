// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef, useEffect, useMemo } from "react";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import RNFS from "react-native-fs";
import { Portal, Dialog, Button, useTheme } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import endpoints from "../../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { apiGet, apiPost } from "../../../../../../../utils/api/apiClient";
import { uploadUpdatedTemplate } from "../../../../../../../utils/templateUploader";
import { uploadUpdatedReport } from "../../../../../../../utils/reportUploader"; // used to populate new draft

const EditTemplate = () => {
  const { templateId } = useLocalSearchParams();
  const [editorContent, setEditorContent] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [fileName, setFileName] = useState("Template");
  const [workspaceId, setWorkspaceId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // New state for creating draft from template
  const [createDraftDialogVisible, setCreateDraftDialogVisible] = useState(false);
  const [newDraftName, setNewDraftName] = useState("");

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
    if (isEditing && webViewRef.current) {
      sendInitToWebView(editorContent); // always send current content
    }
  }, [isEditing, editorContent]);

  useEffect(() => {
    return () => {
      initSentRef.current = false; // reset when component unmounts
    };
  }, []);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId || !workspaceId) return;

      try {
        // pass workspaceId as second param (apiGet will build query) to avoid 400
        const response = await apiGet(
          endpoints.modules.day_book.reports.templates.getTemplate(templateId),
          { workspaceId }
        );

        if (!response) return;

        setFileName(response.name || "Template");

        if (response.fileUrl) {
          const fileResponse = await fetch(response.fileUrl);
          const fileText = await fileResponse.text();
          setEditorContent(fileText || "");
        } else {
          // If API returns content directly (some responses might), try to use it:
          if (response.content) {
            setEditorContent(response.content || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch template:", err);
      }
    };

    fetchTemplate();
  }, [templateId, workspaceId]);

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
                try {
                  window.ReactNativeWebView.postMessage(html);
                } catch (e) {
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
        fileName: "temp_template",
        base64: false,
      });

      const downloadDir = RNFS.DocumentDirectoryPath;

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
    exportAsPDF(fileName.trim() || "Template");
  };

  const handleSaveTemplate = async () => {
    if (!workspaceId || !templateId) {
      Alert.alert("Error", "Missing workspace or template ID.");
      return;
    }

    const success = await uploadUpdatedTemplate({
      workspaceId,
      templateId,
      templateName: fileName,
      editorContent,
    });

    if (success) {
      Alert.alert("Success", "Template updated successfully");
      setIsEditing(false);
      initSentRef.current = false;
    }
  };

  // Create a draft from this template:
  const handleCreateDraftConfirm = async () => {
    // called when user confirms draft name
    const name = (newDraftName || "").trim();
    if (!name) {
      Alert.alert("Validation", "Please enter a draft name.");
      return;
    }
    if (!workspaceId) {
      Alert.alert("Error", "Missing workspace ID.");
      return;
    }

    try {
      // 1) create draft (apiPost)
      const payload = {
        workspaceId,
        name,
      };
      const created = await apiPost(endpoints.modules.day_book.reports.drafts.createDraft, payload);

      // attempt to extract draftId robustly
      let newDraftId =
        created?.draftId ||
        created?.id ||
        created?.data?.draftId ||
        created?.data?.id ||
        created?.draft?.draftId ||
        created?.draft?.id;

      // some APIs return the id under 'draftId' inside 'data' or top-level; handle common shapes
      if (!newDraftId && typeof created === "string") {
        // sometimes apiPost returns just an id as string
        newDraftId = created;
      }

      if (!newDraftId) {
        console.warn("Could not determine new draft id from create response:", created);
        Alert.alert("Error", "Could not create draft (no id returned).");
        return;
      }

      // 2) upload the template HTML into the new draft using your reportUploader helper
      const uploadSuccess = await uploadUpdatedReport({
        workspaceId,
        reportId: newDraftId,
        reportName: name,
        editorContent,
      });

      if (!uploadSuccess) {
        Alert.alert("Warning", "Draft created but failed to populate content.");
        // still navigate to the draft editor so user can fix it
      } else {
        // success
      }

      setCreateDraftDialogVisible(false);
      setNewDraftName("");

      // 3) navigate to the new draft edit page
      router.push(`/modules/day-book/reports/edit-report/${newDraftId}`);
    } catch (err) {
      console.error("Error creating draft from template:", err);
      Alert.alert("Error", "Failed to create draft from template.");
    }
  };

  return (
    <View style={[commonStyles.screen, { backgroundColor: theme.colors.background }]}>
      <Header
        title={"Edit Template"}
        showBack={!isEditing}
        showCheck={isEditing}
        showEllipsis={!isEditing}
        onRightIconPress={isEditing ? handleSaveTemplate : undefined}
      />

      {/* Buttons row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.exportButton} onPress={() => setDialogVisible(true)}>
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </TouchableOpacity>

        {/* Create Draft button (opens name dialog) */}
        {!isEditing && (
          <TouchableOpacity style={styles.createDraftButton} onPress={() => setCreateDraftDialogVisible(true)}>
            <Text style={styles.createDraftButtonText}>Create Draft</Text>
          </TouchableOpacity>
        )}

        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
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

      {/* Create Draft dialog */}
      <Portal>
        <Dialog visible={createDraftDialogVisible} onDismiss={() => setCreateDraftDialogVisible(false)}>
          <Dialog.Title>Create Draft from Template</Dialog.Title>
          <Dialog.Content>
            <Text>Enter draft name:</Text>
            <TextInput
              style={styles.input}
              value={newDraftName}
              onChangeText={setNewDraftName}
              placeholder="Draft name"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDraftDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateDraftConfirm}>Create Draft</Button>
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
  createDraftButton: {
    backgroundColor: "#5856D6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  createDraftButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  editButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  editButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  webview: { flex: 1 },
  input: {
    borderWidth: 1, borderColor: "#ccc", padding: 8, marginTop: 10, borderRadius: 5,
  },
});

export default EditTemplate;
