// Author(s): Matthew Page

import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, TextInput, RadioButton, Dialog, Portal, Button, useTheme } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { apiGet, apiDelete, apiPatch, apiPut } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import AvatarButton from "../../../../../components/common/buttons/AvatarButton";
import { saveProfilePhoto } from "../../../../../utils/profilePhoto";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import DropDown from "../../../../../components/common/input/DropDown";


const EditUser = () => {
	const { userId } = useLocalSearchParams();
	const router = useRouter();
	const theme = useTheme();

	const [workspaceId, setWorkspaceId] = useState(null);
	const [roles, setRoles] = useState([]);

	const [initialDetails, setInitialDetails] = useState({ firstName: "", lastName: "", roleId: ""})
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [isOwner, setIsOwner] = useState(false);

	const [selectedRole, setSelectedRole] = useState("");
	const [saving, setSaving] = useState(false);

	const isFirstAltered = (firstName || "").trim() !== (initialDetails.firstName || "").trim();
	const isLastAltered = (lastName || "").trim() !== (initialDetails.lastName || "").trim();
	const isRoleAltered = selectedRole !== initialDetails.roleId;
	const isAltered = isFirstAltered || isLastAltered || isRoleAltered;

	const [roleDialogVisible, setRoleDialogVisible] = useState(false);
	const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
	const [profilePicture, setProfilePicture] = useState(null);
	const [errors, setErrors] = useState({
		firstName: false,
		lastName: false,
	});

	useEffect(() => {
		const initialise = async () => {
			const workspaceIdTemp = await getWorkspaceId();
			setWorkspaceId(workspaceIdTemp);

			let user;
			try {
				const result = await apiGet(endpoints.workspace.users.getUser(workspaceIdTemp, userId));
				user = result.data;
			} catch (error) {
				console.error("Error fetching user:", error);
				return;
			}
			
			let fetchedRoles;
			try {
				const result = await apiGet(endpoints.workspace.roles.getRoles(workspaceIdTemp));
				fetchedRoles = result.data;
			} catch (error) {
				console.error("Error fetching roles:", error);
				return;
			}

			setFirstName(user.given_name);
			setLastName(user.family_name);
			setSelectedRole(user.roleId);
			setInitialDetails({
				firstName: user.given_name,
				lastName: user.family_name,
				roleId: user.roleId,
			})
			setIsOwner(user.roleId == fetchedRoles.find(role => role.name == "Owner").roleId);

			setRoles(fetchedRoles || []);
		};
		initialise();
	}, []);

	const handleUpdate = async () => {
		const newErrors = {
			firstName: !firstName.trim(),
			lastName: !lastName.trim(),
		};
		setErrors(newErrors);
		if (Object.values(newErrors).some(Boolean)) return;

		try {
			setSaving(true);

			let userDetailsPayload = {};
			let userWorkspaceDetailsPayload = {};

			if (isFirstAltered) userDetailsPayload.given_name = firstName.trim();
			if (isLastAltered) userDetailsPayload.family_name = lastName.trim(); 
			if (isRoleAltered) userWorkspaceDetailsPayload.roleId = selectedRole;

			console.log("payload:", userDetailsPayload);
			if (Object.keys(userDetailsPayload).length > 0) {
				console.log("attempting api personal details...");
				await apiPut(endpoints.user.core.updateUser(userId, workspaceId), userDetailsPayload);
				console.log("Successful.");
				setInitialDetails({
					firstName: userDetailsPayload.given_name,
					lastName: userDetailsPayload.family_name,
				})
			};

			if (Object.keys(userWorkspaceDetailsPayload).length > 0) {
				console.log("Attempting to update role...");
				await apiPatch(endpoints.workspace.users.update(workspaceId, userId), userWorkspaceDetailsPayload);
				console.log("Successful.");
				setInitialDetails({
					roleId: userWorkspaceDetailsPayload.roleId
				})
			}
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
			header={<Header title="Edit User" showBack showCheck={isAltered && !saving} onRightIconPress={handleUpdate} />}
			center={false}
			padded
            scroll={false}
		>

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
				rightButtonPress={() => setFirstName(initialDetails.firstName)}
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
				rightButtonPress={() => setLastName(initialDetails.lastName)}
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
		</ResponsiveScreen>
	);
};

export default EditUser;
