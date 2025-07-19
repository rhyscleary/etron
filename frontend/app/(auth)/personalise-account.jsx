import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import TextField from '../../components/common/input/TextField';
import BasicButton from '../../components/common/buttons/BasicButton';
import { useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import Header from '../../components/layout/Header';
import { commonStyles } from '../../assets/styles/stylesheets/common';
import StackLayout from '../../components/layout/StackLayout';

//import * as ImagePicker from 'expo-image-picker';

const PersonaliseAccount = () => {
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showWorkspaceModal, setWorkspaceModal] = useState(false);
  //const [profilePicture, setProfilePicture] = useState(null);
/*
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };
*/
  const handleSave = async () => {
    console.log({
      displayName,
      fullName,
      phoneNumber,
      //profilePicture
    });
    // BACKEND CONNECTION HERE FOR SAVING DETAILS TO ACCOUNT
    setWorkspaceModal(true);
  };

  const theme = useTheme();

  return (
    <View style={commonStyles.screen}>
      <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>

        
        <Text style={{ fontSize: 24, textAlign: 'center' }}>
          Personalise Your Account
        </Text>

        <StackLayout spacing={30}>
          <TextField
            label="Display Name"
            placeholder="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <TextField
              label="Full Name (Optional)"
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
          />

          <TextField
              label="Phone Number (Optional)"
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
          />
        </StackLayout>

        <View style={{ alignItems: 'flex-end' }}>
          <BasicButton
            label='Continue'
            onPress={handleSave}
          />
        </View>

        <Modal
          visible={showWorkspaceModal}
          animationType="slide"
          transparent={true}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <View style={{
            backgroundColor: theme.colors.background,
            padding: 10,
            borderRadius: 10,
            width: '65%',
            alignItems: 'center'
          }}>

            <Text style={{ fontSize: 24, marginBottom: 20 }}>
              Workspace
            </Text>

            <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
              Are you creating your own workspace or joining an existing one?
            </Text>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 20
          }}>
            <BasicButton
              label="Creating"
              fullWidth='true'
              onPress={() => {
                setWorkspaceModal(false);
                router.push('/(auth)/create-workspace');
              }}
              style={{ marginRight: 50 }}
            />
            <BasicButton
              label="Joining"
              fullWidth='true'
              onPress={() => {
                setWorkspaceModal(false);
                router.push('/(auth)/join-workspace');
              }}
              style={{ marginRight: 50 }}
            />
          </View>
              
          <TouchableOpacity onPress={() => setWorkspaceModal(false)}>
            <Text>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
        </Modal>

      </View>
    </View>
  );
}

export default PersonaliseAccount;

/*
<TouchableOpacity onPress={pickImage} style={{ marginBottom: 20 }}>
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={{ width: 100, height: 100, borderRadius: 50 }} />
        ) : (
          <View style={{
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center'
          }}>
            <Text>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>
*/