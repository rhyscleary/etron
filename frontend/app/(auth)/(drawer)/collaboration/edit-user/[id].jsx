import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, TextInput, RadioButton, Dialog, Portal, Button } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "../../../../../components/layout/Header";
import { commonStyles } from "../../../../../assets/styles/stylesheets/common";
import { apiGet, apiPost } from "../../../../../utils/api/apiClient";
import endpoints from "../../../../../utils/api/endpoints";
import { getWorkspaceId } from "../../../../../storage/workspaceStorage";

const EditUser = () => {
  const { id: userId } = useLocalSearchParams();
  const router = useRouter();

  const [workspaceId, setWorkspaceId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userType, setUserType] = useState("employee");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const id = await getWorkspaceId();
      setWorkspaceId(id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!workspaceId || !userId) return;

    const fetchData = async () => {
      try {
        const user = await apiGet(endpoints.workspace.users.getUser(workspaceId, userId));
        setUserEmail(user.email || "");
        setUserType(user.type || "employee");
        setSelectedRole(user.role || "");

        const fetchedRoles = await apiGet(endpoints.workspace.roles.getRoles(workspaceId));
        setRoles(fetchedRoles || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [workspaceId, userId]);

  const handleUpdate = async () => {
    try {
      const data = {
        type: userType,
        role: selectedRole
      };

      const result = await apiPost(
        endpoints.workspace.users.update(workspaceId, userId),
        data
      );

      console.log("User updated:", result);
      router.back(); // go back after update
    } catch (error) {
      console.log("Update error:", error);
    }
  };

  return (
    <View style={commonStyles.screen}>
      <Header title="Edit User" showBack showCheck onRightIconPress={handleUpdate} />

      <TextInput
        label="Email Address"
        value={userEmail}
        mode="outlined"
        editable={false} // Not sure if we agreed on email address being changeable; Given that its the unique identifier im not sure
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

export default EditUser;
