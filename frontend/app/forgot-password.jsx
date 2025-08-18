// Author(s): Matthew Parkinson, Rhys Cleary

import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Dialog, PaperProvider, Portal, Text } from 'react-native-paper';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';
import Header from '../components/layout/Header';
import { commonStyles } from '../assets/styles/stylesheets/common';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import BasicDialog from '../components/overlays/BasicDialog';
import StackLayout from '../components/layout/StackLayout';


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
        invalidCode: false,
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
      const result = await resetPassword({username});
      console.log("Code sent");

      if (result) {
        setShowCodeSentDialog(true);
      }
    } catch (error) {
      console.error("Error sending code:", error);

      if (error.code === "UserNotFoundException") {
        setErrors((prev) => ({ ...prev, enterField: true}));
      }
    }
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
    return regex.test(password);
  };

  const handleChange = async () => {
    setErrors((prev) => ({
      ...prev,
      passwordInvalid: false,
      passwordMatch: false,
      invalidCode: false
    }));

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
    } catch (error) {
      console.error("Error confirming password reset:", error);
    }
  }

  const handleContinue = () => {
    setCodeSent(true);
    setShowCodeSentDialog(false);
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
                }}
                fullWidth='true'
              />
            </View>
          </>
        ) : (
          <>
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

            <View>
              <BasicButton
                label='Change Password'
                onPress={handleChange}
                fullWidth='true'
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
                    <BasicButton label="Continue" onPress={handleContinue} />
                </Dialog.Actions>
            </Dialog>
        </Portal>

      </View>
      
    </View>
    
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

export default ForgotPassword;