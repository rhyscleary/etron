// Author(s): Matthew Page

import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, TextInput } from "react-native";
import { WebView } from "react-native-webview";
import { useState, useRef, useEffect, useMemo } from "react";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Header from "../../../../../../../components/layout/Header";
import { commonStyles } from "../../../../../../../assets/styles/stylesheets/common";
import RNFS from "react-native-fs";
import { Portal, Dialog, Button, useTheme } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import endpoints from "../../../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../../../storage/workspaceStorage";
import { apiGet } from "../../../../../../../utils/api/apiClient";
import { uploadUpdatedReport } from "../../../../../../../utils/reportUploader";
import { createNewTemplate, uploadUpdatedTemplate } from "../../../../../../../utils/templateUploader";
import { uploadExportFile } from "../../../../../../../utils/exportUploader";
import CustomBottomSheet from "../../../../../../../components/BottomSheet/bottom-sheet";
import ItemNotFound from "../../../../../../../components/common/errors/MissingItem";

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
	const [reportExists, setReportExists] = useState(true);

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
				if (!draft) {
					setReportExists(false);
					return;
				}

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
							styleWithCSS: true,

							classes: {
								actionbar: 'pell-actionbar',
								button: 'pell-button',
								content: 'pell-content'
							}
						});

						// Custom add metric button
						const actionBar = document.querySelector('.pell-actionbar');
						const metricButton = document.createElement('button');
						metricButton.className = 'pell-button';
						metricButton.title = 'Insert Metric';
						metricButton.textContent = '📊 Insert Metric';
						actionBar.appendChild(metricButton);

						metricButton.onclick = () => {
							//window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'openMetricSheet' }));
							const img = document.createElement('img');
							img.src = "https://d329j4s0vk14u1.cloudfront.net/public/workspaces/e905ae63-ab3d-4487-8def-35c8141ffb89/day-book/metrics/metric1.png";
							img.style.maxWidth = '100%';
							img.style.display = 'block';
							img.style.margin = '10px 0';
							editor.content.appendChild(img);
							window.ReactNativeWebView.postMessage(editor.content.innerHTML);
						};

						function receiveMessage(event) {
							let data = event.data;
							try { data = JSON.parse(data); } catch (e) {}

							if (data?.type === 'insertMetric' && data.metricUrl) {
								const img = document.createElement('img');
								img.src = data.metricUrl;
								img.style.maxWidth = '100%';
								img.style.display = 'block';
								img.style.margin = '10px 0';
								editor.content.appendChild(img);
								window.ReactNativeWebView.postMessage(editor.content.innerHTML);
							} else if (data?.type === 'init' || data?.type === 'load') {
								editor.content.innerHTML = data.html || data.content || '';
							}
						}

						function setContent(html) {
							editor.content.innerHTML = html || '';
							const range = document.createRange();
							range.selectNodeContents(editor.content);
							range.collapse(false);
							const sel = window.getSelection();
							sel.removeAllRanges();
							sel.addRange(range);
						}

						document.addEventListener('message', receiveMessage);
						window.addEventListener('message', receiveMessage);
					})();
				</script>
			</body>
		</html>
	`, []);

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
			webViewRef.current.postMessage(JSON.stringify({ type: "init", html: html || "" }));
			initSentRef.current = true;
		} catch {}
	};

	useEffect(() => {
		if (isEditing && !initSentRef.current) {
			setTimeout(() => sendInitToWebView(editorContent), 120);
		}
	}, [isEditing, editorContent]);

	const handleWebViewLoadEnd = () => {
		if (isEditing && !initSentRef.current) sendInitToWebView(editorContent);
	};

	// handle metric bottom sheet messages from webview
	const handleWebViewMessage = (event) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);
			if (data.type == "openMetricSheet") {
				console.log("Open metric sheet");
			} else if (isEditing) {
				setEditorContent(event.nativeEvent.data);
			}
		} catch {}
	};

	// when metric selected send message to pell to add in metric
	const onMetricSelected = (metric) => {
		console.log("Metric selected"); // add metric
	};

	// ✅ Generate and upload PDF
	const exportAsPDF = async (customFileName, upload = false) => {
		try {
			console.log(`[ExportUploader] Generating PDF for export...`);
			const pdf = await RNHTMLtoPDF.convert({
				html: editorContent || "<p>No content</p>",
				fileName: "temp_report",
				base64: false,
			});

			console.log(`[ExportUploader] PDF generated: ${pdf.filePath}`);	

			if (upload) {
				console.log(`[ExportUploader] Uploading PDF to server...`);
				const success = await uploadExportFile({
					workspaceId,
					draftId,
					filePath: pdf.filePath,
					exportName: customFileName,
					fileType: "pdf"
				});

				if (success) {
					console.log(`[ExportUploader] Export uploaded successfully.`);
					Alert.alert("Success", "Export uploaded successfully.");
				} else {
					console.error(`[ExportUploader] Upload failed.`);
					Alert.alert("Error", "Failed to upload export.");
				}
			} else {
				const destPath = `${Platform.OS === "android" ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath}/${customFileName}.pdf`;
				if (await RNFS.exists(destPath)) await RNFS.unlink(destPath);
				await RNFS.moveFile(pdf.filePath, destPath);
				Alert.alert("Export Successful", `PDF saved to:\n${destPath}`);
			}
		} catch (err) {
			console.error(`[ExportUploader] Export failed:`, err);
			Alert.alert("Error", "Export failed.");
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

	return (
		<View style={[commonStyles.screen, { backgroundColor: theme.colors.background }]}>
			{reportExists ? (<>
				<Header
					title={reportId ? "Edit Report" : "New Report"}
					showBack
					showEdit={!isEditing}
					showCheck={isEditing}
					showEllipsis
					onRightIconPress={() => (isEditing ? handleSaveReport() : setIsEditing(true))}
					onEllipsisPress={() => setSheetVisible(true)}
				/>

				<WebView
					key={isEditing ? "editor" : "viewer"}
					ref={webViewRef}
					originWhitelist={["*"]}
					source={{ html: isEditing ? pellHtml : readOnlyHtml }}
					style={styles.webview}
					javaScriptEnabled
					domStorageEnabled
					onMessage={handleWebViewMessage}
					onLoadEnd={handleWebViewLoadEnd}
				/>

				{/* Add bottom sheet to select metrics here */}

				{/* Dialogs */}
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

				{sheetVisible && (
					<TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSheetVisible(false)} />
				)}

				{sheetVisible && (
					<CustomBottomSheet
						variant="standard"
						header={{ showClose: false, solidBackground: true }}
						footer={{ variant: "minimal", placement: "right" }}
						onClose={() => setSheetVisible(false)}
						data={[
							{ label: "Export as PDF", onPress: () => { setDialogVisible(true); setSheetVisible(false); } },
							{ label: "Save Report", onPress: () => { handleSaveReport(); setSheetVisible(false); } },
							{ label: "Save as Template", onPress: () => { handleSaveAsTemplate(); setSheetVisible(false); } },
						]}
						itemTitleExtractor={(item) => item.label}
						onItemPress={(item) => {
							if (typeof item.onPress === "function") item.onPress();
						}}
					/>
				)}
			</>) : (
				<ItemNotFound
					icon = "file-alert-outlinef"
					item = "report"
					itemId = {draftId}
					listRoute = "/modules/day-book/reports/reports"
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
	overlay: {
		position: "absolute",
		top: 0, left: 0, right: 0, bottom: 0,
		backgroundColor: "rgba(0,0,0,0.3)",
	},
	testButton: {
		backgroundColor: "#007AFF",
		padding: 12,
		alignItems: "center",
		margin: 12,
		borderRadius: 8,
	},
});

export default EditReport;
