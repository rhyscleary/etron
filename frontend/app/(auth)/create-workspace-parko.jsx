import React, { useState, useEffect } from 'react';
import { View, TextInput, Button } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../../components/common/input/TextField';
import BasicButton from '../../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { Redirect, useRouter, router, Link } from 'expo-router';

const CreateWorkspaceParko = () => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceLocation, setWorkspaceLocation] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');

  const handleSave = async () => {
    console.log({
      workspaceName,
      workspaceLocation,
      workspaceDescription,
    });
    // BACKEND CONNECTION HERE FOR SAVING DETAILS TO ACCOUNT
    router.push('/(auth)/dashboard');
  };

  const theme = useTheme();

  return (
    <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>
      
      
      <Text style={{ fontSize: 24, textAlign: 'center' }}>
        Create Workspace
      </Text>

      <TextField
        label="Name"
        placeholder="Name"
        value={workspaceName}
        onChangeText={setWorkspaceName}
      />

      <TextField
        label="Location (Optional)"
        placeholder="Location"
        value={workspaceLocation}
        onChangeText={setWorkspaceLocation}
      />

      <TextField
        label="Description (Optional)"
        placeholder="Description"
        value={workspaceDescription}
        onChangeText={setWorkspaceDescription}
      />

      <View style={{ alignItems: 'flex-end' }}>
        <BasicButton
          label='Create'
          onPress={handleSave}
        />
      </View>

    </View>
  );
}

export default CreateWorkspaceParko;