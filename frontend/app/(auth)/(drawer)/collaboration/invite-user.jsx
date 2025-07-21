import React, { useState, useEffect } from "react";
import { View, Alert } from "react-native";
import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { Text, TextInput, RadioButton, Portal, Dialog, List } from "react-native-paper";
import { apiGet, apiPost } from "../../../../utils/api/apiClient"; // Assuming you have these utility functions

const workspaceId = "00c60a07-15e9-488e-bdc4-d33ac9ce3b2b";

const InviteUser = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userType, setUserType] = useState('employee');
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);

  useEffect(() => {
    // Fetch roles on component mount
    async function fetchRoles() {
      try {
        const result = await apiGet(
          `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/roles`
        );

        if (result && Array.isArray(result.roles)) {
          setRoles(result.roles.map(roleObj => roleObj.name || roleObj));
        } else if (Array.isArray(result)) {
          setRoles(result);
        } else {
          console.warn("Unexpected roles response format:", result);
        }
      } catch (error) {
        console.log("Error fetching roles:", error);
      }
    }

    fetchRoles();
  }, []);

  // Invite user function implemented here
  async function inviteUser() {
    if (!userEmail) {
      Alert.alert("Please enter an email address");
      return;
    }
    if (!selectedRole) {
      Alert.alert("Please select a role");
      return;
    }

    try {
      const data = {
        email: userEmail,
        type: userType,
        role: selectedRole,
      };

      const response = await apiPost(
        `https://t8mhrt9a61.execute-api.ap-southeast-2.amazonaws.com/Prod/workspace/${workspaceId}/invites/create`,
        data
      );

      Alert.alert("Invite sent successfully");
      console.log("Invite response:", response);
    } catch (error) {
      Alert.alert("Failed to send invite");
      console.error("Invite error:", error);
    }
  }

  return (
    <View style={commonStyles.screen}>
      <Header
        title="Invite User"
        showBack
        showCheck
        onRightIconPress={inviteUser} // Invite on top check press
      />

      {/* Email Input */}
      <TextInput
        label="Email Address"
        value={userEmail}
        onChangeText={setUserEmail}
        mode="outlined"
        style={{ marginVertical: 16 }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* User Type */}
      <Text variant="labelLarge">User Type</Text>
      <RadioButton.Group onValueChange={setUserType} value={userType}>
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8 }}>
          <RadioButton value="manager" />
          <Text style={{ marginRight: 16 }}>Manager</Text>
          <RadioButton value="employee" />
          <Text>Employee</Text>
        </View>
      </RadioButton.Group>

      {/* Role Selection */}
      <Text variant="labelLarge" style={{ marginTop: 16 }}>
        User Role
      </Text>
      <TextInput
        label="Select Role"
        value={selectedRole}
        mode="outlined"
        editable={false}
        right={<TextInput.Icon icon="menu-down" onPress={() => setRoleDialogVisible(true)} />}
        style={{ marginTop: 8 }}
      />
      {/*Popout for role selection */}
      <Portal>
        <Dialog visible={roleDialogVisible} onDismiss={() => setRoleDialogVisible(false)}>
          <Dialog.Title>Select Role</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 300 }}>
            <List.Section>
              {roles.length === 0 && <List.Item title="No roles found" />}
              {roles.map((role) => (
                <List.Item
                  key={role}
                  title={role}
                  onPress={() => {
                    setSelectedRole(role);
                    setRoleDialogVisible(false);
                  }}
                />
              ))}
            </List.Section>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>


    </View>
  );
};

export default InviteUser;
