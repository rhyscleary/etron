import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../../components/common/input/TextField';
import BasicButton from '../../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';

const JoinWorkspace = () => {
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSave = async () => {
    console.log({
        //Save selected invite as chosen workspace
    });
    // BACKEND CONNECTION HERE FOR SAVING CHOICE
    router.push('/(auth)/dashboard');
  };

  const theme = useTheme();

  return (
    <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>
      
      
      <Text style={{ fontSize: 24, textAlign: 'center' }}>
        Join Workspace
      </Text>

      <Text style={{ fontSize: 16 }}>
        You have the following options:
      </Text>

      <TextField
        label="Display Name"
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <View style={{ alignItems: 'flex-end' }}>
        <BasicButton
          label='Join'
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

export default JoinWorkspace;