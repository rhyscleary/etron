// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef, useEffect } from "react";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import RNFS from "react-native-fs";
import { Portal, Dialog, Button } from "react-native-paper";
import { apiGet, apiPost, apiPut } from "../../../../../../utils/api/apiClient";
import endpoints from "../../../../../../utils/api/endpoints";

const CreateReport = () => {
    const [editorContent, setEditorContent] = useState("");
    const [dialogVisible, setDialogVisible] = useState(false);
    const [saveDialogVisible, setSaveDialogVisible] = useState(false);
    const [fileName, setFileName] = useState("Report"); // default name
    const [reportId, setReportId] = useState(null); // used for determining whether or not to post or put report when saving
    const [workspaceId, setWorkspaceId] = useState(null);
    const webViewRef = useRef(null);

    // Fetch workspace ID
    useEffect(() => {
        const fetchWorkspaceId = async () => {
            try {
                const result = await apiGet(endpoints.workspace.list);
                if (result && result.length > 0) {
                    setWorkspaceId(result[0].id); // take first workspace
                }
            } catch (err) {
                console.error("Failed to fetch workspace ID:", err);
            }
        };
        fetchWorkspaceId();
    }, []);

    // Rich text editor HTML
    const pellHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/pell/dist/pell.min.css">
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              font-family: sans-serif;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            .pell {
              display: flex;
              flex-direction: column;
              height: 100%;
              width: 100%;
            }
            .pell-actionbar {
              position: sticky;
              top: 0;
              background: #fff;
              border-bottom: 1px solid #ccc;
              z-index: 100;
              flex-shrink: 0;
              padding: 6px;
              overflow-x: auto;
              white-space: nowrap;
            }
            .pell-button {
              font-size: 20px;
              min-width: 40px;
              min-height: 40px;
              margin-right: 6px;
            }
            .pell-content {
              flex: 1;
              width: 100%;
              overflow-y: auto;
              padding: 10px;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div id="editor" class="pell"></div>
          <script src="https://unpkg.com/pell"></script>
          <script>
            const editor = window.pell.init({
              element: document.getElementById('editor'),
              onChange: html => {
                window.ReactNativeWebView.postMessage(html);
              },
              defaultParagraphSeparator: 'p',
              styleWithCSS: true
            });
          </script>
        </body>
      </html>
    `;

    // local export
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

    // upload to database / backend
    const saveReport = async () => {
        if (!workspaceId) {
            Alert.alert("Error", "No workspace available.");
            return;
        }

        try {
            if (!reportId) {
                // Create new report
                const body = {
                    workspaceId,
                    name: fileName.trim() || "Report",
                    content: editorContent,
                };
                const result = await apiPost(endpoints.reports.createDraft, body);
                setReportId(result.id);
                Alert.alert("Success", "Report created successfully.");
            } else {
                // Update existing report
                const body = {
                    id: reportId,
                    workspaceId,
                    name: fileName.trim() || "Report",
                    content: editorContent,
                };
                await apiPut(endpoints.reports.update(reportId), body);
                Alert.alert("Success", "Report updated successfully.");
            }
        } catch (err) {
            console.error("Report save failed:", err);
            Alert.alert("Error", "Could not save report.");
        } finally {
            setSaveDialogVisible(false);
        }
    };

    return (
        <View style={commonStyles.screen}>
            <Header title="Structure Report" showBack />

            {/* Buttons row */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.exportButton} onPress={() => setDialogVisible(true)}>
                    <Text style={styles.exportButtonText}>Export PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={() => setSaveDialogVisible(true)}>
                    <Text style={styles.saveButtonText}>Save Report</Text>
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
                onMessage={(event) => {
                    setEditorContent(event.nativeEvent.data);
                }}
            />

            {/* Dialog for filename input - Export PDF */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>Export PDF</Dialog.Title>
                    <Dialog.Content>
                        <Text>Enter file name:</Text>
                        <TextInput
                            style={styles.input}
                            value={fileName}
                            onChangeText={setFileName}
                            placeholder="Report"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleExport}>Export</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Dialog for filename input - Save Report */}
            <Portal>
                <Dialog visible={saveDialogVisible} onDismiss={() => setSaveDialogVisible(false)}>
                    <Dialog.Title>{reportId ? "Update Report" : "Create Report"}</Dialog.Title>
                    <Dialog.Content>
                        <Text>Enter report name:</Text>
                        <TextInput
                            style={styles.input}
                            value={fileName}
                            onChangeText={setFileName}
                            placeholder="Report"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setSaveDialogVisible(false)}>Cancel</Button>
                        <Button onPress={saveReport}>{reportId ? "Update" : "Save"}</Button>
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
    exportButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    saveButton: {
        backgroundColor: "#34C759",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    saveButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    webview: {
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 8,
        marginTop: 10,
        borderRadius: 5,
    },
});

export default CreateReport;
