// Matthew Parkinson

import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';
import Header from '../components/layout/Header';


const ForgotPassword = () => {
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSendCode = async () => {
    console.log({
        //Save selected invite as chosen workspace
    });
    // BACKEND CONNECTION HERE FOR SAVING CHOICE
    router.navigate('/reset-password');
  };

  const theme = useTheme();

  return (
    <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>
      
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
    </View>
  );
}

export default ForgotPassword;