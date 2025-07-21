import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../components/common/input/TextField';
import BasicButton from '../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';
import StackLayout from '../components/layout/StackLayout';

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
        Password must be at least 12 characters long, and contain at least 1 capital letter, 1 number and 1 symbol
      </Text>

      <StackLayout spacing={30}>
        <TextField
          label="New Password"
          placeholder="New Password"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <TextField
          label="Confirm Passowrd"
          placeholder="Confirm Password"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </StackLayout>

      <View>
        <BasicButton
          label='Change Password'
          onPress={handleSave}
          fullWidth='true'
        />
      </View>
    </View>
  );
}

export default ResetPassword;