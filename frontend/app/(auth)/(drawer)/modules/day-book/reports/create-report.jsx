// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef } from "react";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import RNFS from "react-native-fs";

const CreateReport = () => {
    const [editorContent, setEditorContent] = useState("");
    const webViewRef = useRef(null);

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
          styleWithCSS: true,
          actions: [
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'heading1',
            'heading2',
            'paragraph',
            'quote',
            'olist',
            'ulist',
            'code',
            'line',
            {
              name: 'left',
              icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 6h12v2H3v-2zm0 6h18v2H3v-2zm0 6h12v2H3v-2z"/></svg>',
              title: 'Align Left',
              result: () => document.execCommand('justifyLeft', false, null)
            },
            {
              name: 'center',
              icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm3 6h12v2H6v-2zm-3 6h18v2H3v-2zm3 6h12v2H6v-2z"/></svg>',
              title: 'Align Center',
              result: () => document.execCommand('justifyCenter', false, null)
            },
            {
              name: 'right',
              icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm6 6h12v2H9v-2zm-6 6h18v2H3v-2zm6 6h12v2H9v-2z"/></svg>',
              title: 'Align Right',
              result: () => document.execCommand('justifyRight', false, null)
            }
          ]

        });
      </script>
    </body>
  </html>
`;


    const exportAsPDF = async () => {
        try {
            const file = await RNHTMLtoPDF.convert({
                html: editorContent || "<p>No content</p>",
                fileName: "Report",
                base64: false,
            });

            const downloadDir =
                Platform.OS === "android"
                    ? RNFS.DownloadDirectoryPath
                    : RNFS.DocumentDirectoryPath;

            const destPath = `${downloadDir}/Report.pdf`;

            await RNFS.copyFile(file.filePath, destPath);

            Alert.alert("Export Successful", `PDF saved to:\n${destPath}`);
        } catch (err) {
            console.error("PDF export failed:", err);
            Alert.alert("Error", "Could not export PDF.");
        }
    };

    return (
        <View style={commonStyles.screen}>
            <Header title="Structure Report" showBack />

            <View style={styles.exportContainer}>
                <TouchableOpacity style={styles.exportButton} onPress={exportAsPDF}>
                    <Text style={styles.exportButtonText}>Export PDF</Text>
                </TouchableOpacity>
            </View>

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
        </View>
    );
};

const styles = StyleSheet.create({
    exportContainer: {
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
    },
    exportButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    webview: {
        flex: 1,
    },
});

export default CreateReport;
