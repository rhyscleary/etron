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
import { updateUserAttribute } from "aws-amplify/auth";
import { getUserType } from "../../../../../storage/userStorage";
import { saveProfilePhoto } from "../../../../../utils/profilePhoto";
import ResponsiveScreen from "../../../../../components/layout/ResponsiveScreen";
import DropDown from "../../../../../components/common/input/DropDown";

const EditUser = () => {
	const { userId } = useLocalSearchParams();
	const router = useRouter();
	const theme = useTheme();

	const [workspaceId, setWorkspaceId] = useState(null);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [roles, setRoles] = useState([]);
	const [selectedRole, setSelectedRole] = useState("");
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

			try {
				const user = await apiGet(endpoints.workspace.users.getUser(workspaceIdTemp, userId));
				setFirstName(user.given_name);
				setLastName(user.family_name);
				setSelectedRole(user.roleId || "");
			} catch (error) {
				console.error("Error fetching user:", error);
				return;
			}
			
			try {
				const fetchedRolesResult = await apiGet(endpoints.workspace.roles.getRoles(workspaceIdTemp));
				const fetchedRoles = fetchedRolesResult.data;
				setRoles(fetchedRoles || []);
			} catch (error) {
				console.error("Error fetching roles:", error);
				return;
			}
		};
		initialise();
	}, []);

	// updates user details
	async function handleUpdateUserAttribute(attributeKey, value) {
		try {
			const output = await updateUserAttribute({
				userAttribute: {
					attributeKey,
					value
				}
			});

			const { nextStep } = output;

			switch (nextStep.updateAttributeStep) {
				case 'CONFIRM_ATTRIBUTE_WITH_CODE':
					const codeDeliveryDetails = nextStep.codeDeliveryDetails;
					console.log(`Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium} at ${codeDeliveryDetails?.destination}`);
					return { needsConfirmation: true };
				case 'DONE':
					const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
					console.log(`${fieldName} updated successfully`);
					return { needsConfirmation: false };
				default:
					console.log(`${attributeKey.replace('_', ' ')} update completed`);
					return { needsConfirmation: false };
			}
		} catch (error) {
			console.error("Error updating user attribute:", error);
			const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
			setMessage(`Error updating ${fieldName}: ${error.message}`);
			return { needsConfirmation: false, error: true };
		}
	}

	async function handleSaveUserAttributes() {
		try {
			if (firstName?.trim()) {
				await handleUpdateUserAttribute('given_name', firstName.trim());
			};

			if (lastName?.trim()) {
				await handleUpdateUserAttribute('family_name', lastName.trim());
			};

			if (!profilePicture) {
				const removed = await saveProfilePhoto();
				if (removed) {
					await handleUpdateUserAttribute('picture', "");
				}
			}

		} catch (error) {
			console.error("Error updating Cognito attributes:", error);
		}
	}	

	const handleUpdate = async () => {
		const newErrors = {
			firstName: !firstName.trim(),
			lastName: !lastName.trim(),
		};
		setErrors(newErrors);

		try {
			const userData = {
				given_name: firstName.trim(),
				family_name: lastName.trim()
			};

			const userResponse = await apiPut(
				endpoints.user.core.updateUser(userId, workspaceId),
				userData
			);

			console.log("User updated:", userResponse.data);

			console.log("Selected role:", selectedRole)
			const workspaceUserData = {
				roleId: selectedRole
			}

			const workspaceUserResponse = await apiPatch(
				endpoints.workspace.users.update(workspaceId, userId),
				workspaceUserData
			);

			console.log("Workspace User updated:", workspaceUserResponse.data);

			router.back();
		} catch (error) {
			console.error("Update error:", error);
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
			header={<Header title="Edit User" showBack showCheck onRightIconPress={handleUpdate} />}
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
				placeholder="First Name"
				onChangeText={setFirstName}
			/>

			{errors.firstName && (
				<Text style={{ color: theme.colors.error }}>Please enter a valid first name</Text>
			)}

			<TextField
				label="Last Name"
				value={lastName}
				placeholder="Last Name"
				onChangeText={setLastName}
			/>

			{errors.lastName && (
				<Text style={{ color: theme.colors.error }}>Please enter a valid last name</Text>
			)}

			<DropDown 
				title="Select Role"
				items={roles.map(role => ({
					label: `${role.name}`,
					value: role.roleId
				}))}
				showRouterButton={false}
				onSelect={(roleId) => setSelectedRole(roleId)}
            />

			{/* Remove User Button */}
			<BasicButton 
				label="Remove User"
				danger={true}
				fullWidth={true}
				onPress={() => setRemoveDialogVisible(true)}
			/>

			{/* Role Selection Dialog */}
			<Portal>
				<Dialog visible={roleDialogVisible} onDismiss={() => setRoleDialogVisible(false)}>
					<Dialog.Title>Select a Role</Dialog.Title>
					<Dialog.ScrollArea>
						<ScrollView style={{ paddingHorizontal: 16 }}>
							{roles.map((role) => (
								<TouchableOpacity
									key={role.roleId}
									onPress={() => {
										setSelectedRole(role.roleId);
										setRoleDialogVisible(false);
									}}
									style={{
										paddingVertical: 12,
										borderBottomWidth: 1,
										borderBottomColor: "#eee",
									}}
								>
									<Text>{role.name}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</Dialog.ScrollArea>
					<Dialog.Actions>
						<Button onPress={() => setRoleDialogVisible(false)}>Cancel</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

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
