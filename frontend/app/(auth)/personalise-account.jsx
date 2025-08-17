// Author(s): Noah Bradley, Rhys Cleary

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
import { Auth } from 'aws-amplify';
import AvatarButton from '../../components/common/buttons/AvatarButton';
import { uploadProfilePhotoFromDevice, uploadProfilePhotoToS3 } from '../../utils/profilePhoto';
import { getCurrentUser, updateUserAttribute, updateUserAttributes } from 'aws-amplify/auth';
import WorkspaceDialog from '../../components/overlays/WorkspaceDialog';

//import * as ImagePicker from 'expo-image-picker';

const PersonaliseAccount = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showWorkspaceModal, setWorkspaceModal] = useState(false);
  const [needsPhoneConfirmation, setNeedsPhoneConfirmation] = useState(false);
  const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        phoneNumber: false,
  });

  async function handleChoosePhoto() {
    try {
      const uri = await uploadProfilePhotoFromDevice();
      setProfilePicture(uri);
    } catch (error) {
      console.log(error.message);
    }
  }

  const handleRemovePhoto = () => {
      setProfilePicture(null);
  };

  // updates user details, including verification code if needed (shouldn't be) 
  async function handleUpdateUserAttribute(attributeKey, value) {
      try {
          const output = await updateUserAttribute({
              userAttribute: {
                  attributeKey,
                  value
              }
          });

          const { nextStep } = output;

          switch (nextStep.updateAttributeStep) {
              case 'CONFIRM_ATTRIBUTE_WITH_CODE':
                  const codeDeliveryDetails = nextStep.codeDeliveryDetails;
                  console.log(`Confirmation code was sent to ${codeDeliveryDetails?.deliveryMedium} at ${codeDeliveryDetails?.destination}`);
                  if (attributeKey === 'phone_number') {
                      setNeedsPhoneConfirmation(true);
                  }
                  return { needsConfirmation: true };
              case 'DONE':
                  const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                  console.log(`${fieldName} updated successfully`);
                  return { needsConfirmation: false };
              default:
                  console.log(`${attributeKey.replace('_', ' ')} update completed`);
                  return { needsConfirmation: false };
          }
      } catch (error) {
          console.log("Error updating user attribute:", error);
          const fieldName = attributeKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          setMessage(`Error updating ${fieldName}: ${error.message}`);
          return { needsConfirmation: false, error: true };
      }
  }


  async function handleSaveUserAttributes() {
    try {
      if (firstName?.trim()) {
        await handleUpdateUserAttribute('given_name', firstName.trim());
      };

      if (lastName?.trim()) {
        await handleUpdateUserAttribute('family_name', lastName.trim());
      };

      if (phoneNumber?.trim()) {
        // clean the phone number. ensure it starts with +61
        const formattedPhone = phoneNumber.startsWith('+61') ? phoneNumber : `+61${phoneNumber}`;
        await handleUpdateUserAttribute('phone_number', formattedPhone);
      };

      if (profilePicture) {
        const s3Url = await uploadProfilePhotoToS3(profilePicture);
        if (s3Url) {
          await handleUpdateUserAttribute('picture', s3Url);
        }
      }

      setWorkspaceModal(true);

    } catch (error) {
      console.log("Error updating Cognito attributes:", error);
    }
  }

  async function handleContinue() {
    const newErrors = {
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
            phoneNumber: phoneNumber && (phoneNumber.length < 9 || phoneNumber.length > 10),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setSaving(true);

    try {
      await handleSaveUserAttributes();
    } finally {
      setSaving(false);
    }
  };

  const theme = useTheme();

  return (
    <View style={commonStyles.screen}>
      <View style={{ padding: 20, gap: 30, justifyContent: 'center' }}>

        
        <Text style={{ fontSize: 24, textAlign: 'center' }}>
          Account Personalisation
        </Text>

        <StackLayout spacing={30}>
          <View style={{ alignItems: "center"}}>
            <AvatarButton 
              type={profilePicture ? "image" : "default"}
              imageSource={profilePicture ? {uri: profilePicture} : undefined}
              firstName={firstName}
              lastName={lastName}
              badgeType={profilePicture ? "edit" : "plus"}
              onPress={handleChoosePhoto}
            />
            {profilePicture && (
              <Button title="Remove Photo" onPress={handleRemovePhoto} />
            )}
          </View>

          <TextField
            label="First Name"
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          {errors.firstName && (
            <Text style={{ color: theme.colors.error }}>Please enter your first name</Text>
          )}

          <TextField
              label="Last Name"
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
          />

          {errors.lastName && (
              <Text style={{ color: theme.colors.error }}>Please enter your last name</Text>
          )}

          <TextField
              label="Phone Number (Optional)"
              placeholder="Phone Number"
              value={phoneNumber}
              maxLength={10}
              keyboardType="numeric"
              textContentType="telephoneNumber"
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (text.length >= 9 && text.length <= 10) {
                  setErrors((prev) => ({ ...prev, phoneNumber: false }));
                }
              }}
          />

          {errors.phoneNumber && (
            <Text style={{ color: theme.colors.error }}>Phone number must be 9-10 digits</Text>
          )}
        </StackLayout>

        <View style={{ alignItems: 'flex-end' }}>
          <BasicButton
            label={saving ? "Saving..." : "Continue"}
            onPress={handleContinue}
          />
        </View>

        <WorkspaceDialog
          visible={showWorkspaceModal}
          onDismiss={() => setWorkspaceModal(false)}
          setWorkspaceModal={setWorkspaceModal}
          router={router}
          showGoBack={true}
        />

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