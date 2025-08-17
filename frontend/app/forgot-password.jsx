// Author(s): Matthew Parkinson

import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';
import Header from '../components/layout/Header';
import { commonStyles } from '../assets/styles/stylesheets/common';


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const theme = useTheme();

  const headerTitle = !codeSent ? "Forgot Password" : "Reset Password";

  const handleSendCode = async () => {
    if (!email && !phone) {
      console.log("Please enter email or phone number");
      return;
    }
    router.push('/reset-password');
  };


  return (
    <View style={commonStyles.screen}>
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
            onChangeText={setEmail}
          />

          <Text style={{ fontSize: 20, textAlign: 'center' }}>
            OR
          </Text>

          <TextField
            label="Phone Number"
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <View>
            <BasicButton
              label='Send Password Reset Code'
              onPress={handleSendCode}
              fullWidth='true'
            />
          </View>
        </>
      ) : (
        <>
        </>
      )}
    </View>
    
  );
}

{/*<View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>
      
      <Header title="Forgot Password" showBack />

      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        Please enter your email or phone number linked to your account to recieve a password reset code.
      </Text>

      <TextField
        label="Email Address"
        placeholder="Email"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <Text style={{ fontSize: 20, textAlign: 'center' }}>
        OR
      </Text>

      <TextField
        label="Phone Number"
        placeholder="Phone Number"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <View>
        <BasicButton
          label='Send Password Reset Code'
          onPress={handleSendCode}
          fullWidth='true'
        />
      </View>
    </View>*/}

export default ForgotPassword;