// Author(s): Matthew Page

import { useState, useEffect } from "react";
import { View, Keyboard, ActivityIndicator } from "react-native";
import { Text, Dialog, Portal, Button, useTheme, Snackbar } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { apiGet, apiDelete, apiPatch, apiPut } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import AvatarButton from "../../../../../components/common/buttons/AvatarButton";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import DropDown from "../../../../../components/common/input/DropDown";
import DecisionDialog from "../../../../../components/overlays/DecisionDialog";
import { getUserInfo } from "../../../../../storage/userStorage";

const EditUser = () => {
	const { userId } = useLocalSearchParams();
	const router = useRouter();
	const theme = useTheme();
	const [snack, setSnack] = useState({ visible: false, text: ""});
    const [loading, setLoading] = useState(true);

	const [workspaceId, setWorkspaceId] = useState(null);
	const [roles, setRoles] = useState([]);
	const [isSelf, setIsSelf] = useState(false);

	const [initialFirstName, setInitialFirstName] = useState("");
	const [initialLastName, setInitialLastName] = useState("");
	const [initialRoleId, setInitialRoleId] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [isOwner, setIsOwner] = useState(false);
	const [selectedRole, setSelectedRole] = useState("");
	const [saving, setSaving] = useState(false);

	const isFirstAltered = (firstName || "").trim() !== (initialFirstName || "").trim();
	const isLastAltered = (lastName || "").trim() !== (initialLastName || "").trim();
	const isRoleAltered = selectedRole !== initialRoleId;
	const isAltered = isFirstAltered || isLastAltered || isRoleAltered;

	const [confirmRoleChangeVisible, setConfirmRoleChangeVisible] = useState(false);
	const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
	const [profilePicture, setProfilePicture] = useState(null);
	const [errors, setErrors] = useState({
		firstName: false,
		lastName: false,
	});

	useEffect(() => {
		const initialise = async () => {
			setLoading(true);

			const loggedInUser = await getUserInfo();
			if (loggedInUser.userId = userId) {
				setIsSelf(true);
			}

			const workspaceId = await getWorkspaceId();
			setWorkspaceId(workspaceId);

			let user;
			try {
				const result = await apiGet(endpoints.workspace.users.getUser(workspaceId, userId));
				user = result.data;
			} catch (error) {
				console.error("Error fetching user:", error);
				return;
			}
			
			let fetchedRoles;
			try {
				const result = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
				fetchedRoles = result.data;
			} catch (error) {
				console.error("Error fetching roles:", error);
				return;
			}
			setRoles(fetchedRoles || []);

			setFirstName(user.given_name);
			setLastName(user.family_name);
			setSelectedRole(user.roleId);
			setInitialFirstName(user.given_name);
			setInitialLastName(user.family_name);
			setInitialRoleId(user.roleId);
			setIsOwner(user.roleId == fetchedRoles.find(role => role.name == "Owner").roleId);

			setLoading(false);
		};
		initialise();
	}, []);

	const preUpdateCheck = async () => {
		Keyboard.dismiss();

		// Make sure both names have input
		const newErrors = {
			firstName: !firstName.trim(),
			lastName: !lastName.trim(),
		};
		setErrors(newErrors);
		if (Object.values(newErrors).some(Boolean)) return;

		// Check if user is removing their own ability to edit users
		if (isSelf && isRoleAltered && !roles.find(role => role.roleId.includes(selectedRole)).permissions.includes("app.collaboration.manage_users")) {
			setConfirmRoleChangeVisible(true);
		} else handleUpdate();
	}

	const handleUpdate = async () => {
		
		try {
			setSaving(true);

			let userDetailsPayload = {};
			let userWorkspaceDetailsPayload = {};
			if (isFirstAltered) userDetailsPayload.given_name = firstName.trim();
			if (isLastAltered) userDetailsPayload.family_name = lastName.trim(); 
			if (isRoleAltered) userWorkspaceDetailsPayload.roleId = selectedRole;

			let didUpdate = false;

			console.log("payload:", userDetailsPayload);
			if (Object.keys(userDetailsPayload).length > 0) {
				await apiPut(endpoints.user.core.updateUser(userId, workspaceId), userDetailsPayload);
				didUpdate = true;
				if (isFirstAltered) setInitialFirstName(userDetailsPayload.given_name);
				if (isLastAltered) setInitialLastName(userDetailsPayload.family_name);
			};

			if (Object.keys(userWorkspaceDetailsPayload).length > 0) {
				await apiPatch(endpoints.workspace.users.update(workspaceId, userId), userWorkspaceDetailsPayload);
				didUpdate = true;
				if (isRoleAltered) setInitialRoleId(userWorkspaceDetailsPayload.roleId);
			}

			if (didUpdate) { setSnack({ visible: true, text: "Changes saved" })};
		} catch (error) {
			console.error("Error updating user:", error);
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveUser = async () => {
		try {
			await apiDelete(endpoints.workspace.users.remove(workspaceId, userId));
			router.back();
		} catch (error) {
			console.error("Remove user failed:", error);
		}
	};

	const handleRemovePhoto = () => {
		setProfilePicture(null);
	};

	return (
		<ResponsiveScreen
			header={<Header title="Edit User" showBack showCheck={isAltered && !saving} onRightIconPress={preUpdateCheck} />}
			center={false}
			padded
            scroll={false}
		>

			{ loading ? (
				<View style={commonStyles.centeredContainer}>
					<ActivityIndicator size="large" />
				</View>
			) : (<>
				<View style={{ alignItems: "center"}}>
					<AvatarButton
						type={profilePicture ? "image" : "text"}
						imageSource={profilePicture ? {uri: profilePicture} : undefined}
						firstName={firstName}
						lastName={lastName}
						badgeType={profilePicture ? "remove" : "plus"}
						//onPress={handleChoosePhoto}
					/>
					{profilePicture && (
						<Button title="Remove Photo" onPress={handleRemovePhoto} />
					)}
				</View>

				<TextField
					label="First Name"
					value={firstName}
					onChangeText={setFirstName}
					customRightButton={isFirstAltered}
					rightButtonIcon="backup-restore"
					rightButtonPress={() => setFirstName(initialFirstName)}
				/>

				{errors.firstName && (
					<Text style={{ color: theme.colors.error }}>Please enter a valid first name</Text>
				)}

				<TextField
					label="Last Name"
					value={lastName}
					onChangeText={setLastName}
					customRightButton={isLastAltered}
					rightButtonIcon="backup-restore"
					rightButtonPress={() => setLastName(initialLastName)}
				/>

				{errors.lastName && (
					<Text style={{ color: theme.colors.error }}>Please enter a valid last name</Text>
				)}

				{isOwner ? (
					<View pointerEvents="none" style={{ opacity: 0.6 }}>
						<DropDown
							label="Select Role"
							items={roles.map(role => ({ label: role.name, value: role.roleId }))}
							value={selectedRole}
							onSelect={() => {}}
							showRouterButton={false}
						/>
					</View>
				) : ( <DropDown
					label="Select Role"
					items={roles
						.filter(role => role.name !== "Owner")
						.map(role => ({ label: role.name, value: role.roleId }))
					}
					value={selectedRole}
					onSelect={(roleId) => setSelectedRole(roleId)}
					showRouterButton={false}
				/>)}

				{/* Remove User Button */}
				<BasicButton 
					label="Remove User"
					danger={true}
					fullWidth={true}
					onPress={() => setRemoveDialogVisible(true)}
				/>

				{/* Remove Confirmation Dialog */}
				<Portal>
					<Dialog visible={removeDialogVisible} onDismiss={() => setRemoveDialogVisible(false)}>
						<Dialog.Title>Confirm Removal</Dialog.Title>
						<Dialog.Content>
							<Text>Are you sure you want to remove this user?</Text>
						</Dialog.Content>
						<Dialog.Actions>
							<Button onPress={() => setRemoveDialogVisible(false)}>Cancel</Button>
							<Button onPress={handleRemoveUser} textColor="#b00020">Remove</Button>
						</Dialog.Actions>
					</Dialog>
				</Portal>

				<Portal>
					<DecisionDialog
						visible={confirmRoleChangeVisible}
						title="Confirm role change"
						message="You are editing your own role to one that cannot manage users. If you continue, you will be unable to change your role again."
						leftActionLabel="Cancel"
						handleLeftAction={() => setConfirmRoleChangeVisible(false)}
						rightActionLabel="Confirm"
						rightDanger
						handleRightAction={() => {
							setConfirmRoleChangeVisible(false);
							handleUpdate();
						}}
					/>
				</Portal>

				<Snackbar
					visible={snack.visible}
					onDismiss={() => setSnack(s => ({ ...s, visible: false }))}
					duration={2500}
					style={{ marginBottom: 8 }}
				>
					{snack.text}
				</Snackbar>
			</>)}
		</ResponsiveScreen>
	);
};

export default EditUser;
