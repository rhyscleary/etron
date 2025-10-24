// Author(s): Noah Bradley

import { View, StyleSheet, Keyboard } from "react-native";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Text, ActivityIndicator, useTheme, Card, Snackbar } from "react-native-paper";
import Header from "../../../../../components/layout/Header";
import StackLayout from "../../../../../components/layout/StackLayout";
import TextField from "../../../../../components/common/input/TextField";
import UnsavedChangesDialog from "../../../../../components/overlays/UnsavedChangesDialog";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { router } from "expo-router";

import { apiGet, apiPatch } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";

export default function EditWorkspace() {
	const theme = useTheme();

	const [workspaceId, setWorkspaceId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [name, setName] = useState("");
	const [location, setLocation] = useState("");
	const [description, setDescription] = useState("");

	const [errors, setErrors] = useState({});
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

	const [snack, setSnack] = useState({ visible: false, text: "", tone: "info"});

	const initialRef = useRef({ name: "", location: "", description: "" });

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const id = await getWorkspaceId();
			setWorkspaceId(id);

			const res = await apiGet(endpoints.workspace.core.getWorkspace(id));
			const w = res.data;

			setName(w?.name ?? "");
			setLocation(w?.location ?? "");
			setDescription(w?.description ?? "");

			initialRef.current = {
				name: w?.name ?? "",
				location: w?.location ?? "",
				description: w?.description ?? "",
			};
		} catch (e) {
			console.error("Failed to load workspace:", e);
			setSnack({ visible: true, text: "Failed to load workspace", tone: "error" });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const initialValuesChanged = useMemo(() => {
		const i = initialRef.current;
		return (
			(name || "").trim() !== (i.name || "").trim() ||
			(location || "").trim() !== (i.location || "").trim() ||
			(description || "").trim() !== (i.description || "").trim()
		);
	}, [name, location, description]);

	const canSave = useMemo(() => {
		return !saving && initialValuesChanged && !!name.trim();
	}, [saving, initialValuesChanged, name]);

	const handleSave = async () => {
		Keyboard.dismiss();

		const nextErrors = { name: !name.trim() };
		setErrors(nextErrors);
		if (Object.values(nextErrors).some(Boolean)) return;

		try {
			setSaving(true);
			await apiPatch(endpoints.workspace.core.update(workspaceId), {
				name: name.trim(),
				location: location.trim() || null,
				description: description.trim() || null,
			});

			// freeze current values as initial
			initialRef.current = {
				name: name.trim(),
				location: location.trim(),
				description: description.trim(),
			};

			setSnack({ visible: true, text: "Workspace updated", tone: "info" });
			// go back to details after save
			router.back();
		} catch (e) {
			console.error("Failed to save workspace:", e);
			setSnack({ visible: true, text: "Failed to update workspace", tone: "error" });
		} finally {
			setSaving(false);
		}
	};

	const handleBack = () => {
		if (!initialValuesChanged) return router.back();
		setShowUnsavedDialog(true);
	};

	return (
		<ResponsiveScreen
			header={
				<Header
					title="Edit Workspace"
					showBack
					onBackPress={handleBack}
					showCheck={canSave}
					onRightIconPress={handleSave}
				/>
			}
			center={false}
			padded
			scroll={false}
		>
			<View style={styles.contentContainer}>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" />
						<Text>Loading workspace...</Text>
					</View>
				) : (
					<View>
						<StackLayout spacing={32}>
							<TextField
								label="Name"
								value={name}
								placeholder="Workspace name"
								onChangeText={(t) => {
									setName(t);
									if (t.trim()) setErrors((p) => ({ ...p, name: false }));
								}}
								error={!!errors.name}
							/>
							{errors.name ? (
								<Text style={{ color: theme.colors.error, marginTop: -8 }}>
									Please enter a name.
								</Text>
							) : null}

							<TextField
								label="Location (Optional)"
								value={location}
								placeholder="Location"
								onChangeText={setLocation}
							/>
							<TextField
								label="Description (Optional)"
								value={description}
								placeholder="Description"
								onChangeText={setDescription}
								multiline
							/>
						</StackLayout>
					</View>
				)}
			</View>

			{/* Saving overlay */}
			{saving && (
				<View pointerEvents="none" style={styles.savingOverlay}>
					<ActivityIndicator size="large" />
				</View>
			)}

			<UnsavedChangesDialog
				visible={showUnsavedDialog}
				onDismiss={() => setShowUnsavedDialog(false)}
				handleLeftAction={() => {
					setShowUnsavedDialog(false);
					router.back();
				}}
				handleRightAction={() => setShowUnsavedDialog(false)}
			/>

			<Snackbar
				visible={snack.visible}
				onDismiss={() => setSnack((s) => ({ ...s, visible: false }))}
				duration={2200}
				style={{
					alignSelf: "center",
					borderRadius: 12,
					backgroundColor:
						snack.tone === "error" ? theme.colors.errorContainer : theme.colors.inverseSurface,
				}}
				theme={{
					colors: {
						onSurface:
							snack.tone === "error" ? theme.colors.onErrorContainer : theme.colors.inverseOnSurface,
					},
				}}
				wrapperStyle={{ alignItems: "center", justifyContent: "center" }}
				action={{
					label: "Dismiss",
					onPress: () => setSnack((s) => ({ ...s, visible: false })),
				}}
			>
				<Text
					style={{
						fontWeight: "600",
						marginBottom: 2,
						color:
							snack.tone === "error"
								? theme.colors.onErrorContainer
								: theme.colors.inverseOnSurface,
					}}
				>
					{snack.tone === "error" ? "Update failed" : "Success"}
				</Text>
				<Text
					style={{
						color:
							snack.tone === "error"
								? theme.colors.onErrorContainer
								: theme.colors.inverseOnSurface,
					}}
				>
					{snack.text}
				</Text>
			</Snackbar>
		</ResponsiveScreen>
	);
}

const styles = StyleSheet.create({
	contentContainer: { flex: 1 },
	loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
	savingOverlay: {
		position: "absolute",
		inset: 0,
		backgroundColor: "rgba(0,0,0,0.25)",
		alignItems: "center",
		justifyContent: "center",
	},
});