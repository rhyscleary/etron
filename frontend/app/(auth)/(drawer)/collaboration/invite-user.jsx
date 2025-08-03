import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, TextInput, RadioButton, Dialog, Portal, Button } from "react-native-paper";
import { router } from "expo-router"; // ✅ import router

import Header from "../../../../components/layout/Header";
import { commonStyles } from "../../../../assets/styles/stylesheets/common";
import { apiGet, apiPost } from "../../../../utils/api/apiClient";
import { getWorkspaceId } from "../../../../storage/workspaceStorage";
import endpoints from "../../../../utils/api/endpoints";

const InviteUser = () => {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userType, setUserType] = useState("employee");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);

  useEffect(() => {
    const fetchId = async () => {
      const id = await getWorkspaceId();
      setWorkspaceId(id);
    };
    fetchId();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchRoles = async () => {
      try {
        const result = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
        console.log("Fetched roles:", result);

        setRoles(result || []);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, [workspaceId]);

  const handleCheck = async () => {
    if (!userEmail || !selectedRole || !workspaceId) {
      console.warn("Missing data for invite.");
      return;
    }

    try {
      const selectedRoleObj = roles.find(role => role.name === selectedRole);

      if (!selectedRoleObj) {
        console.warn("Selected role not found in roles list.");
        return;
      }

      const data = {
        email: userEmail,
        type: userType,
        roleId: selectedRoleObj.roleId,
      };

      const result = await apiPost(
        endpoints.workspace.invites.create(workspaceId),
        data
      );

      console.log("Invite sent:", result);

      // ✅ Redirect to invites list after sending invite
      router.replace("/collaboration/invites");

    } catch (error) {
      console.error("Error sending invite:", error);
    }
  };

  return (
    <View style={commonStyles.screen}>
      <Header title="Invite User" showBack showCheck onRightIconPress={handleCheck} />

      <TextInput
        label="Email Address"
        value={userEmail}
        onChangeText={setUserEmail}
        mode="outlined"
        style={{ marginVertical: 16 }}
      />

      <Text style={{ marginBottom: 4 }}>User Type</Text>
      <RadioButton.Group onValueChange={setUserType} value={userType}>
        <RadioButton.Item label="Manager" value="manager" />
        <RadioButton.Item label="Employee" value="employee" />
      </RadioButton.Group>

      <TouchableOpacity onPress={() => setRoleDialogVisible(true)}>
        <TextInput
          label="Select Role"
          value={selectedRole}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="menu-down" />}
          style={{ marginTop: 8 }}
        />
      </TouchableOpacity>

      <Portal>
        <Dialog visible={roleDialogVisible} onDismiss={() => setRoleDialogVisible(false)}>
          <Dialog.Title>Select a Role</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ paddingHorizontal: 16 }}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.roleId}
                  onPress={() => {
                    setSelectedRole(role.name);
                    setRoleDialogVisible(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eee",
                  }}
                >
                  <Text>{role.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setRoleDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default InviteUser;
