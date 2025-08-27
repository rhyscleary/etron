// Author(s): Matthew Page

import React, { useRef, useState } from "react";
import { View, Button, StyleSheet, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import Header from "../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../assets/styles/stylesheets/common";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// ⚠️ For DOCX export, you’ll need html-docx-js (npm install html-docx-js)
// For PDF, you’ll need react-native-html-to-pdf
import HtmlDocx from "html-docx-js/dist/html-docx";
import RNHTMLtoPDF from "react-native-html-to-pdf";

const RichTextReport = () => {
  const webViewRef = useRef(null);
  const [editorContent, setEditorContent] = useState("<p>Start writing here...</p>");

  // ---- Export as PDF ----
  const exportAsPDF = async () => {
    try {
      const file = await RNHTMLtoPDF.convert({
        html: editorContent,
        fileName: "MyReport",
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.filePath);
      }
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  // ---- Export as DOCX ----
  const exportAsDocx = async () => {
    try {
      const blob = HtmlDocx.asBlob(editorContent);
      const base64 = await blobToBase64(blob);

      const path = FileSystem.documentDirectory + "MyReport.docx";
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      }
    } catch (err) {
      console.error("DOCX export failed:", err);
    }
  };

  // ---- Export as RTF (fallback: just save raw RTF markup) ----
  const exportAsRtf = async () => {
    try {
      const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Arial;}}\\f0 ${editorContent}}`;

      const path = FileSystem.documentDirectory + "MyReport.rtf";
      await FileSystem.writeAsStringAsync(path, rtfContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      }
    } catch (err) {
      console.error("RTF export failed:", err);
    }
  };

  // ---- Export as ODT (⚠️ usually needs server conversion; here raw HTML fallback) ----
  const exportAsOdt = async () => {
    try {
      const path = FileSystem.documentDirectory + "MyReport.odt";
      await FileSystem.writeAsStringAsync(path, editorContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      }
    } catch (err) {
      console.error("ODT export failed:", err);
    }
  };

  // Helper: convert Blob → base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <View style={commonStyles.screen}>
      <Header title="Write Report" showBack />

      {/* Export buttons */}
      <ScrollView
        horizontal
        contentContainerStyle={styles.exportButtons}
        showsHorizontalScrollIndicator={false}
      >
        <Button title="Export PDF" onPress={exportAsPDF} />
        <Button title="Export DOCX" onPress={exportAsDocx} />
        <Button title="Export RTF" onPress={exportAsRtf} />
        <Button title="Export ODT" onPress={exportAsOdt} />
      </ScrollView>

      {/* Rich Text Editor */}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.editor}
        source={{
          html: `
            <html>
              <head>
                <style>
                  body { font-family: Arial; padding: 10px; }
                  #toolbar { position: sticky; top: 0; background: #eee; padding: 5px; }
                  button { margin: 2px; }
                  #editor { min-height: 100%; }
                </style>
              </head>
              <body>
                <div id="toolbar">
                  <button onclick="document.execCommand('bold')">Bold</button>
                  <button onclick="document.execCommand('italic')">Italic</button>
                  <button onclick="document.execCommand('underline')">Underline</button>
                </div>
                <div id="editor" contenteditable="true">${editorContent}</div>
                <script>
                  const editor = document.getElementById('editor');
                  editor.addEventListener('input', () => {
                    window.ReactNativeWebView.postMessage(editor.innerHTML);
                  });
                </script>
              </body>
            </html>
          `,
        }}
        onMessage={(event) => setEditorContent(event.nativeEvent.data)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  exportButtons: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
  },
  editor: {
    flex: 1,
    marginTop: 10,
  },
});

export default RichTextReport;
