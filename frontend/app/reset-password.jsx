import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';


const ResetPassword = () => {
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSave = async () => {
    console.log({
        //Save selected invite as chosen workspace
    });
    // BACKEND CONNECTION HERE FOR SAVING CHOICE
    router.push('/login-signup');
  };

  const theme = useTheme();

  return (
    <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>
      
      
      <Text style={{ fontSize: 24, textAlign: 'center' }}>
        Password Reset
      </Text>

      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        Enter your email or phone number linked to your account to recieve a password reset link
      </Text>

      <TextField
        label="Email Address"
        placeholder="Email"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TextField
        label="Phone Number"
        placeholder="Phone Number"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <View>
        <BasicButton
          label='Send Password Reset Link'
          onPress={handleSave}
          fullWidth='true'
        />
      </View>
    </View>
  );
}

export default ResetPassword;