// Author(s): Matthew Parkinson, Rhys Cleary

import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';
import Header from '../components/layout/Header';
import { commonStyles } from '../assets/styles/stylesheets/common';
import { resetPassword } from 'aws-amplify/auth';


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [showCodeSentDialog, setShowCodeSentDialog] = useState(false);
  const [errors, setErrors] = useState({
        enterField: false,
        code: false,
        passwordInvalid: false,
        passwordMatch: false,
  });

  const theme = useTheme();

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
      await resetPassword({username});
      console.log("Code sent");
    } catch (error) {
      console.error("Error sending code:", error);
    }
  };

  const handleChange = async () => {

    if (newPassword !== confirmPassword) {
      console.log("Passwords do not match");
      return;
    }

    if (!validatePassword(newPassword)) {
      console.log("Invalid password");
      return;
    }

    try {
      const username = email || phoneNumber;
      await confirmPassword({
        username,
        confirmationCode: code,
        newPassword,
      });

      console.log("Password changed successfully!");

      router.navigate({
        pathname: '/login-signup',
        params: { isSignUp: "false" },
      });
    } catch (error) {
      console.error("Error confirming password reset:", error);
    }
  }

  const handleContinue = () => {
    setCodeSent(true);
  }


  return (
    <View style={commonStyles.screen}>
      <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>
        <Header title={headerTitle} showBack />

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

            <View>
              <BasicButton
                label='Send Password Reset Code'
                onPress={async () => {
                  await handleSendCode();
                  setShowCodeSentDialog(true);
                }}
                fullWidth='true'
              />
            </View>
          </>
        ) : (
          <>
            <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>
      
              <Header title={headerTitle} showBack />

              <Text style={{ fontSize: 16, textAlign: 'center' }}>
                Password must be at least 12 characters long, with 1 uppercase letter, 1 number and 1 symbol.
              </Text>

              <StackLayout spacing={30}>

                <TextField
                  label="Confirmation Code"
                  placeholder="Confirmation Code"
                  value={code}
                  onChangeText={setCode}
                />

                {errors.code && (
                    <Text style={{ color: theme.colors.error }}>Invalid code</Text>
                )}

                <TextField
                  label="New Password"
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <TextField
                  label="Confirm Passowrd"
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

              <View>
                <BasicButton
                  label='Change Password'
                  onPress={handleChange}
                  fullWidth='true'
                />
              </View>
            </View>
          </>
        )}

      </View>
      
    </View>
    
  );
}

export default ForgotPassword;