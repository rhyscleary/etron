// Author(s): Noah Bradley, Rhys Cleary

import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import TextField from '../../components/common/input/TextField';
import BasicButton from '../../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import StackLayout from '../../components/layout/StackLayout';
import AvatarButton from '../../components/common/buttons/AvatarButton';
import { loadProfilePhoto, removeProfilePhotoFromLocalStorage, getPhotoFromDevice, saveProfilePhoto } from '../../utils/profilePhoto';
import { fetchUserAttributes, signOut, updateUserAttribute } from 'aws-amplify/auth';
import DecisionDialog from '../../components/overlays/DecisionDialog';
import ResponsiveScreen from '../../components/layout/ResponsiveScreen';
import Header from '../../components/layout/Header';

//import * as ImagePicker from 'expo-image-picker';

const PersonaliseAccount = () => {
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [profilePicture, setProfilePicture] = useState(null);
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showWorkspaceModal, setWorkspaceModal] = useState(false);
	const [pictureChanged, setPictureChanged] = useState(false);
	const [needsPhoneConfirmation, setNeedsPhoneConfirmation] = useState(false);
	const [errors, setErrors] = useState({
		firstName: false,
		lastName: false,
		phoneNumber: false,
	});

	async function handleChoosePhoto() {
		const uri = await getPhotoFromDevice();
		setProfilePicture(uri);
		setPictureChanged(true);
	}

	const handleRemovePhoto = () => {
		setProfilePicture(null);
		setPictureChanged(true);
	};

	useEffect(() => {
		loadProfileData();
	}, []);

	async function loadProfileData() {
		setLoading(true);
		try {
			const userAttributes = await fetchUserAttributes();
			
			setFirstName(userAttributes.given_name || "");
			setLastName(userAttributes.family_name || "");
			// remove country code from phone number
			const phoneNumber = userAttributes.phone_number || "";
			const cleanPhone = phoneNumber.startsWith('+61') ? 
					phoneNumber.substring(3) : phoneNumber;
			setPhoneNumber(cleanPhone);

			const profilePhotoUri = await loadProfilePhoto();
			setProfilePicture(profilePhotoUri || null);
			
		} catch (error) {
			console.error("Error loading personal details: ", error);
			setMessage("Error loading personal details");
		}
		setLoading(false);
	}

	// updates user details, including verification code if needed (shouldn't be) 
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
					if (attributeKey === 'phone_number') {
							setNeedsPhoneConfirmation(true);
					}
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

			if (phoneNumber?.trim()) {
				// clean the phone number. ensure it starts with +61
				const formattedPhone = phoneNumber.startsWith('+61') ? phoneNumber : `+61${phoneNumber}`;
				await handleUpdateUserAttribute('phone_number', formattedPhone);
			};

			if (pictureChanged) {
				if (profilePicture) {
					const s3Url = await saveProfilePhoto(profilePicture);
					if (s3Url) {
						await handleUpdateUserAttribute('picture', s3Url);
					}
				} else {
					await handleUpdateUserAttribute('picture', "");
					await removeProfilePhotoFromLocalStorage();
				}
			}

			setWorkspaceModal(true);

		} catch (error) {
			console.error("Error updating Cognito attributes:", error);
		}
	}

	async function handleContinue() {
		const newErrors = {
			firstName: !firstName.trim(),
			lastName: !lastName.trim(),
			phoneNumber: phoneNumber && (phoneNumber.length < 9 || phoneNumber.length > 10),
		};
		setErrors(newErrors);

		if (Object.values(newErrors).some(Boolean)) {
			return;
		}

		setSaving(true);

		try {
			await handleSaveUserAttributes();
		} finally {
			setSaving(false);
		}
	};

	const theme = useTheme();

	async function handleSignOut() {
		await signOut();
	}

	return (
		<ResponsiveScreen
			header={<Header title="Account Personalisation"/>}
		>
			<View style={{ alignItems: "center"}}>
				<AvatarButton 
					type={profilePicture ? "image" : "default"}
					imageSource={profilePicture ? {uri: profilePicture} : undefined}
					firstName={firstName}
					lastName={lastName}
					badgeType={profilePicture ? "edit" : "plus"}
					onPress={handleChoosePhoto}
				/>
				{profilePicture && (
					<BasicButton label="Remove Photo" onPress={handleRemovePhoto} />
				)}
			</View>

			<TextField
				label="First Name"
				placeholder="First Name"
				value={firstName}
				onChangeText={setFirstName}
			/>

			{errors.firstName && (
				<Text style={{ color: theme.colors.error }}>Please enter your first name</Text>
			)}

			<TextField
					label="Last Name"
					placeholder="Last Name"
					value={lastName}
					onChangeText={setLastName}
			/>

			{errors.lastName && (
					<Text style={{ color: theme.colors.error }}>Please enter your last name</Text>
			)}

			<TextField
					label="Phone Number (Optional)"
					placeholder="Phone Number"
					value={phoneNumber}
					maxLength={10}
					keyboardType="numeric"
					textContentType="telephoneNumber"
					onChangeText={(text) => {
						setPhoneNumber(text);
						if (text.length >= 9 && text.length <= 10) {
							setErrors((prev) => ({ ...prev, phoneNumber: false }));
						}
					}}
			/>

			{errors.phoneNumber && (
				<Text style={{ color: theme.colors.error }}>Phone number must be 9-10 digits</Text>
			)}

			<View style={{ alignItems: 'flex-end' }}>
				<BasicButton
					label="Sign out"
					onPress={()=> { handleSignOut() }}
				/>
				<BasicButton
					label={saving ? "Saving..." : "Continue"}
					onPress={handleContinue}
				/>
			</View>

			<DecisionDialog
				visible={showWorkspaceModal}
				title="Workspace"
				message="Create your own workspace or join an existing one."
				showGoBack={true}
				leftActionLabel="Create"
				handleLeftAction={() => {
					setWorkspaceModal(false);
					router.navigate("/(auth)/create-workspace");
				}}
				rightActionLabel="Join"
				handleRightAction={() => {
					setWorkspaceModal(false);
					router.navigate("/(auth)/join-workspace");
				}}
				handleGoBack={() => {
					setWorkspaceModal(false);
				}}
			/>

		</ResponsiveScreen>
	);
}

export default PersonaliseAccount;