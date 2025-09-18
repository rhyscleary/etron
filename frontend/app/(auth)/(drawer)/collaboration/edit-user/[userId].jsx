// Author(s): Matthew Page

import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, TextInput, RadioButton, Dialog, Portal, Button, useTheme } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { apiGet, apiPut, apiDelete, apiPatch } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";
import TextField from "../../../../../components/common/input/TextField";
import BasicButton from "../../../../../components/common/buttons/BasicButton";
import { uploadProfilePhotoFromDevice } from "../../../../../utils/profilePhoto";
import AvatarButton from "../../../../../components/common/buttons/AvatarButton";
import { updateUserAttribute } from "aws-amplify/auth";
import { getUserType } from "../../../../../storage/userStorage";

const EditUser = () => {
	const { userId } = useLocalSearchParams();
	const router = useRouter();
	const theme = useTheme();

	const [workspaceId, setWorkspaceId] = useState(null);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [userType, setUserType] = useState("employee");
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
			const userType = await getUserType();
			console.log("userType:", userType);
			const workspaceIdTemp = await getWorkspaceId();
			setWorkspaceId(workspaceIdTemp);

			try {
				console.log("workspaceId:", workspaceIdTemp);
				console.log("userId:", userId);
				const user = await apiGet(endpoints.workspace.users.getUser(workspaceIdTemp, userId));
				console.log("user:", user);
				setUserType(user.type || "employee");
				setFirstName(user.given_name);
				setLastName(user.family_name);
				setSelectedRole(user.roleId || "");
			} catch (error) {
				console.error("Error fetching user:", error);
				return;
			}
			
			try {
				console.log("workspaceId:", workspaceIdTemp);
				const fetchedRoles = await apiGet(endpoints.workspace.roles.getRoles(workspaceIdTemp));
				console.log("fetchedRoles:", fetchedRoles);
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
			console.log("Error updating user attribute:", error);
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
				const removed = await uploadProfilePhotoToS3();
				if (removed) {
					await handleUpdateUserAttribute('picture', "");
				}
			}

		} catch (error) {
			console.log("Error updating Cognito attributes:", error);
		}
	}	

	const handleUpdate = async () => {
		const newErrors = {
			firstName: !firstName.trim(),
			lastName: !lastName.trim(),
		};
		setErrors(newErrors);

		try {
			const data = {
				given_name: firstName.trim(),
				family_name: lastName.trim(),
				type: userType,
				roleId: selectedRole
			};

			const result = await apiPatch(
				endpoints.workspace.users.update(workspaceId, userId),
				data
			);

			console.log("User updated:", result);
			router.back();
		} catch (error) {
			console.log("Update error:", error);
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
		<View style={commonStyles.screen}>
			<Header title="Edit User" showBack showCheck onRightIconPress={handleUpdate} />

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

			<Text style={{ marginBottom: 4 }}>User Type</Text>
			<RadioButton.Group onValueChange={setUserType} value={userType}>
				<RadioButton.Item label="Manager" value="manager" />
				<RadioButton.Item label="Employee" value="employee" />
			</RadioButton.Group>

			<TouchableOpacity onPress={() => setRoleDialogVisible(true)}>
				<TextInput
					label="Select Role"
					value={selectedRole}
					mode="outlined"
					editable={false}
					right={<TextInput.Icon icon="menu-down" />}
					style={{ marginTop: 8 }}
				/>
			</TouchableOpacity>

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
										setSelectedRole(role.name);
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
		</View>
	);
};

export default EditUser;
