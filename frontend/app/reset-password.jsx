// Author(s): Matthew Parkinson, Rhys Cleary

import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import Header from '../components/layout/Header';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import StackLayout from '../components/layout/StackLayout';
import ResponsiveScreen from '../components/layout/ResponsiveScreen';


const ResetPassword = () => {
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [codeSent, setCodeSent] = useState(false);
	const [showCodeSentDialog, setShowCodeSentDialog] = useState(false);
	const [errors, setErrors] = useState({
		enterField: false,
		invalidCode: false,
		passwordInvalid: false,
		passwordMatch: false,
	});
	const [updating, setUpdating] = useState(false);
	const [notMatching, setNotMatching] = useState(false);
	const [globalError, setGlobalError] = useState("");

	const theme = useTheme();

	useEffect(() => {
		if (newPassword && confirmPassword) {
			setNotMatching(newPassword !== confirmPassword);
		} else {
			setNotMatching(false); // reset if one is empty
		}
	}, [newPassword, confirmPassword]);

	const headerTitle = !codeSent ? "Forgot Password" : "Reset Password";

	const handleSendCode = async () => {
		const username = email || phoneNumber;
		const newErrors = {
			enterField: !username
		};
		setErrors(newErrors);

		if (!username) return;

		// try sending code
		try {
			const result = await resetPassword({username});
			console.log("Code sent");

			if (result) {
				setShowCodeSentDialog(true);
			}
		} catch (error) {
			console.error("Error sending code:", error);

			let errorMessage = "There was an error sending the reset code";

			switch (error.name) {
				case "UserNotFoundException":
					errorMessage = "No account found with that email or phone number";
					break;
				case "LimitExceededException":
					errorMessage = "Too many attempts. Try again later";
					break;
				case "InvalidParameterException":
					errorMessage = "The provided email or phone number is invalid";
					break;
				default:
					errorMessage = error.message || "There was an error sending the reset code";
			}

			setGlobalError(errorMessage);
		}
	};

	const validatePassword = (password) => {
		const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
		return regex.test(password);
	};

	const handleChange = async () => {
		setUpdating(true);

		setErrors((prev) => ({
			...prev,
			passwordInvalid: false,
			passwordMatch: false,
			invalidCode: false
		}));
		setGlobalError("");

		if (newPassword !== confirmPassword) {
			console.log("Passwords do not match");
			setErrors((prev) => ({ ...prev, passwordMatch: true}));
			return;
		}

		if (!validatePassword(newPassword)) {
			console.log("Invalid password");
			setErrors((prev) => ({ ...prev, passwordInvalid: true}));
			return;
		}

		if (!code) {
			setErrors((prev) => ({ ...prev, invalidCode: true}));
			return;
		}

		try {
			const username = email || phoneNumber;
			await confirmResetPassword({
				username,
				confirmationCode: code,
				newPassword,
			});

			console.log("Password changed successfully!");

			router.navigate({
				pathname: '/login-signup',
				params: { isSignUp: "false" },
			});

			setUpdating(false);
		} catch (error) {
			console.error("Error confirming password reset:", error);

			let errorMessage = "There was an error changing your password";

			switch (error.name) {
				case "CodeMismatchException": 
					errorMessage = "The confirmation code is incorrect";
					break;
				case 'NotAuthorizedException':
					errorMessage = "Current password is incorrect";
					break;
				case 'InvalidPasswordException':
					errorMessage = "New password does not meet requirements";
					break;
				case 'LimitExceededException':
					errorMessage = "Too many attempts. Please try again later";
					break;
				case 'InvalidParameterException':
					errorMessage = "Password format is invalid";
					break;
				default:
					errorMessage = error.message || "There was an error changing your password";
			}

			setGlobalError(errorMessage);
			setUpdating(false);
		}
	}

	const handleContinue = () => {
		setCodeSent(true);
		setShowCodeSentDialog(false);
	}

	return (
		<ResponsiveScreen
			header={<Header title={headerTitle} showBack />}
			center={false}
			padded
		>
			{!codeSent ? (
				<>
					<Text style={{ fontSize: 16, textAlign: 'center' }}>
						Please enter your email or phone number linked to your account to recieve a password reset code.
					</Text>

					<TextField
						label="Email Address"
						placeholder="Email"
						value={email}
						onChangeText={(text) => {
							setEmail(text);
							if (errors.enterField && text) setErrors((prev) => ({...prev, enterField: false}));
						}}
					/>

					<Text style={{ fontSize: 20, textAlign: 'center' }}>
						OR
					</Text>

					<TextField
						label="Phone Number"
						placeholder="Phone Number"
						value={phoneNumber}
						onChangeText={(text) => {
							setPhoneNumber(text);
							if (errors.enterField && text) setErrors((prev) => ({...prev, enterField: false}));
						}}
					/>

					{errors.enterField && (
						<Text style={{ color: theme.colors.error }}>Enter a email or phone number.</Text>
					)}

					{globalError ? (
						<Text style={{ color: theme.colors.error, textAlign: "center" }}>
							{globalError}
						</Text>
					) : null}

					<View>
						<BasicButton
							label='Send Password Reset Code'
							onPress={async () => {
								await handleSendCode();
							}}
							fullWidth='true'
						/>
					</View>
				</>
			) : (
				<>
					<Text style={{ fontSize: 16, textAlign: 'center' }}>
						Password must be at least 8 characters and include a uppercase letter, number and symbol.
					</Text>

					<StackLayout spacing={30}>

						<TextField
							label="Confirmation Code"
							placeholder="Confirmation Code"
							value={code}
							onChangeText={setCode}
						/>

						{errors.invalidCode && (
								<Text style={{ color: theme.colors.error }}>Invalid code.</Text>
						)}

						<TextField
							label="New Password"
							placeholder="New Password"
							value={newPassword}
							onChangeText={setNewPassword}
							secureTextEntry
						/>

						<TextField
							label="Confirm Password"
							placeholder="Confirm Password"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry
						/>

						{errors.passwordInvalid && (
							<Text style={{ color: theme.colors.error }}>The password is invalid. Please see above criteria.</Text>
						)}

						{errors.passwordMatch && (
							<Text style={{ color: theme.colors.error }}>The passwords do not match.</Text>
						)}
					</StackLayout>

					{globalError ? (
						<Text style={{ color: theme.colors.error, textAlign: "center" }}>
							{globalError}
						</Text>
					) : null}

					<View>
						<BasicButton
							label={updating? "Updating..." : "Change Password"}
							onPress={handleChange}
							fullWidth={true}
							disabled={updating || notMatching}
						/>
					</View>
				</>
			)}

			<Portal>
				<Dialog visible={showCodeSentDialog} style={[styles.dialog, {backgroundColor: theme.colors.surface}]}>
					<Dialog.Title style={styles.title}>Code Sent</Dialog.Title>

					<Dialog.Content>
						<Text variant="bodyLarge">A confirmation code has been sent. Do not share this with anyone.</Text>
					</Dialog.Content>

					<Dialog.Actions style={styles.actions}>
						<BasicButton 
							label="Continue" 
							onPress={handleContinue} 
						/>
					</Dialog.Actions>
				</Dialog>
			</Portal>

		</ResponsiveScreen>
	);
}

const styles = StyleSheet.create({
	dialog: {
		borderRadius: 10
	},
	title: {
		textAlign: "center"
	},
	actions: {
		justifyContent: "center"
	}
})

export default ResetPassword;